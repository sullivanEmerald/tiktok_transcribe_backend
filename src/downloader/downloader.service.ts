// downloader.service.ts
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { CreateTranscriptionDto } from '../translate/dto/create-translate.dto';
import { RedisService } from 'src/common/redis.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { BadRequestException } from '@nestjs/common';

type VideoPlatform = 'tiktok' | 'instagram' | 'youtube' | 'unknown';

@Injectable()
export class DownloaderService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }


  private detectPlatform(url: string): VideoPlatform {
    if (/tiktok\.com/i.test(url)) return 'tiktok';
    if (/instagram\.com/i.test(url)) return 'instagram';
    if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
    return 'unknown';
  }


  private get apiKey(): string {
    return this.configService.get<string>('FASTSAVER_API_KEY')!;
  }

  // ─── Fetch Meta Per Platform ───────────────────────────────────────────────

  private async fetchTikTokOrInstagramMeta(videoUrl: string) {
    const { data } = await axios.get('https://api.fastsaver.io/v1/fetch', {
      params: { url: videoUrl },
      headers: { 'X-Api-Key': this.apiKey },
      timeout: 30_000,
    });

    if (!data?.ok) {
      throw new Error(data?.error || 'FastSaver returned a failed response');
    }

    return {
      download_url: data.download_url as string,
      title: (data.title as string) || 'video',
      thumbnail: data.thumbnail_url || null,
      caption: data.caption || '',
    };
  }

  private async fetchYoutubeMeta(videoUrl: string, format = '720p') {
    const { data } = await axios.post(
      'https://api.fastsaver.io/v1/youtube/download',
      { url: videoUrl, format },
      {
        headers: { 'X-Api-Key': this.apiKey },
        timeout: 30_000,
      },
    );

    if (!data?.ok) {
      throw new Error(data?.error || 'FastSaver YouTube fetch failed');
    }

    return {
      download_url: data.download_url as string,
      title: (data.title as string) || 'video',
      thumbnail: data.thumbnail_url || null,
      caption: '',
    };
  }


  async getVideoMeta(dto: CreateTranscriptionDto & { format?: string }) {
    const { videoUrl, format } = dto;
    const platform = this.detectPlatform(videoUrl);

    switch (platform) {
      case 'tiktok':
      case 'instagram':
        return this.fetchTikTokOrInstagramMeta(videoUrl);

      case 'youtube':
        return this.fetchYoutubeMeta(videoUrl, format ?? '720p');

      default:
        throw new BadRequestException(
          'Unsupported URL. Paste a TikTok, Instagram, or YouTube link.',
        );
    }
  }

  async streamVideoToClient(dto: CreateTranscriptionDto, res: Response) {
    const meta = await this.getVideoMeta(dto);


    // Fetch the actual video as a stream — do NOT buffer it all in memory
    const videoStream = await axios.get<NodeJS.ReadableStream>(meta.download_url, {
      responseType: 'stream',
      timeout: 30_000,
    });

    const contentType =
      videoStream.headers['content-type'] || 'clipScript_video/mp4';

    const contentLength = videoStream.headers['content-length'];

    // Sanitize filename — remove characters that break Content-Disposition
    const safeTitle = meta.title.replace(/[^a-zA-Z0-9_\- ]/g, '_').trim();

    // These headers are what force "Save As" on the browser
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Pipe the upstream response directly to the client response
    // This never loads the full video into memory
    videoStream.data.pipe(res);

    // Handle upstream errors mid-stream
    videoStream.data.on('error', (err) => {
      console.error('Stream error from CDN:', err);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Upstream stream failed' });
      } else {
        res.destroy(); // headers already sent, just kill the connection
      }
    });
  }
}