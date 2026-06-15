import { Utterance } from 'src/common/interfaces/utterance.interface';

export interface TranscriptData {
    transcript: string;
    metadata: {
        platform?: string;
        videoUrl?: string;
        description?: string;
        author?: {
            username: string;
            displayName: string;
            avatarUrl: string;
        };
        media?: {
            thumbnailUrl: string;
        };
        stats?: {
            views: number;
            likes: number;
            comments: number;
            shares: number;
        };
    };
    utterances?: Utterance[];

}

export function formatSupadataTranscript(platformData: any): TranscriptData {
    // Flatten transcript array to string
    const transcript = (platformData.transcript || [])
        .map((u: any) => u.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Map utterances to required format
    const utterances: Utterance[] = (platformData.transcript || []).map((u: any) => ({
        text: u.text,
        start: u.offset,
        end: u.offset + (u.duration || 0),
    }));

    // Map metadata to required frontend structure
    const md = platformData.metadata || {};
    const metadata = {
        platform: md.platform,
        videoUrl: md.videoUrl,
        description: md.description,
        author: md.author ? {
            username: md.author.username,
            displayName: md.author.displayName,
            avatarUrl: md.author.avatarUrl,
        } : undefined,
        media: md.media ? {
            thumbnailUrl: md.media.thumbnailUrl,
        } : undefined,
        stats: md.stats ? {
            views: md.stats.views,
            likes: md.stats.likes,
            comments: md.stats.comments,
            shares: md.stats.shares,
        } : undefined,
    };

    return {
        transcript,
        metadata,
        utterances,
    };
}
