export interface TranscriptResult {
    transcript: string;
    utterances: import('./utterance.interface').Utterance[];
    source: 'captions' | 'assemblyai';
}
