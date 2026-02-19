import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { exec } from 'child_process';


@Processor('transcription')
export class TranscriptionProcessor {
    private readonly logger = new Logger(TranscriptionProcessor.name);

    @Process('process-video')
    async handleTranscription(job: Job) {
        const { videoUrl } = job.data;
        const tempDir = './tmp';
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        // 1. Download audio using yt-dlp and ffmpeg (Linux-compatible)
        const audioPath = path.join(tempDir, `${job.id}.mp3`);
        const ytDlpPath = '/usr/bin/yt-dlp'; // default install path for apt
        const ytDlpCmd = `${ytDlpPath} --cookies /app/cookies.txt -x --audio-format mp3 -o "${audioPath}" "${videoUrl}"`;
        this.logger.log(`yt-dlp command: ${ytDlpCmd}`);
        try {
            await new Promise((resolve, reject) => {
                exec(ytDlpCmd, (error, stdout, stderr) => {
                    this.logger.log('yt-dlp stdout:', stdout);
                    this.logger.log('yt-dlp stderr:', stderr);
                    if (error) {
                        this.logger.error(`yt-dlp error: ${error.message}`);
                        reject(error);
                    } else {
                        this.logger.log('yt-dlp audio download complete');
                        resolve(true);
                    }
                });
            });
        } catch (err) {
            this.logger.error('Failed to download audio with yt-dlp', err);
            throw new Error('Audio download failed');
        }

        // 2. Send audio to AssemblyAI (or other provider)
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            this.logger.error('Missing AssemblyAI API key');
            throw new Error('Missing AssemblyAI API key');
        }
        let audioUrl: string;
        try {
            const audioData = fs.createReadStream(audioPath);
            const uploadRes = await axios.post(
                'https://api.assemblyai.com/v2/upload',
                audioData,
                { headers: { authorization: apiKey, 'transfer-encoding': 'chunked' } }
            );
            this.logger.log('AssemblyAI upload response:', uploadRes.data);
            audioUrl = uploadRes.data.upload_url;
            this.logger.log('Audio uploaded to AssemblyAI');
        } catch (err) {
            this.logger.error('Failed to upload audio to AssemblyAI', err.response?.data || err);
            throw new Error('Audio upload failed');
        }

        let transcriptId: string;
        try {
            this.logger.log('Submitting transcript job with:', { audio_url: audioUrl });
            const transcriptRes = await axios.post(
                'https://api.assemblyai.com/v2/transcript',
                { audio_url: audioUrl, speech_models: ["universal-3-pro"] },
                { headers: { authorization: apiKey } }
            );
            transcriptId = transcriptRes.data.id;
            this.logger.log(`Transcript job submitted: ${transcriptId}`);
        } catch (err) {
            this.logger.error('Failed to submit transcript job', err.response?.data || err);
            throw new Error('Transcript job submission failed');
        }

        // 3. Poll for transcript completion
        let transcriptText = '';
        try {
            while (true) {
                const statusRes = await axios.get(
                    `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                    { headers: { authorization: apiKey } }
                );
                if (statusRes.data.status === 'completed') {
                    transcriptText = statusRes.data.text;
                    this.logger.log('Transcription completed');
                    break;
                }
                if (statusRes.data.status === 'failed') {
                    this.logger.error('Transcription failed', statusRes.data);
                    throw new Error('Transcription failed');
                }
                await new Promise((r) => setTimeout(r, 5000));
            }
        } catch (err) {
            this.logger.error('Error while polling for transcript', err);
            throw new Error('Transcript polling failed');
        }

        // 4. Clean up temp files
        try {
            fs.unlinkSync(audioPath);
        } catch (err) {
            this.logger.warn('Failed to clean up temp audio file', err);
        }

        // 5. Return transcript
        this.logger.log('Transcribed text:', transcriptText);
        return transcriptText;
    }
}
