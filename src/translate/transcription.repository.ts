import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transcription } from './schema/transcription.schema';

@Injectable()
export class TranscriptionRepository {
    constructor(
        @InjectModel(Transcription.name) private transcriptionModel: Model<Transcription>,
    ) { }

    async create(data: { transcript: string; ip: string; utterances: any[]; metadata: any, videoUrl: string, userId: string }) {
        const { transcript, ip, utterances, metadata, videoUrl, userId } = data;
        return this.transcriptionModel.create({ transcript, ip, utterances, metadata, videoUrl, userId });
    }

    async findByJobId(jobId: string) {
        return this.transcriptionModel.findOne({ jobId });
    }

    async fetchByJobId(id: string) {
        console.log('Finding transcription by job ID:', id);
        return this.transcriptionModel.findById(id);
    }

    async findByUserId(userId: string) {
        return this.transcriptionModel.find({ userId }).sort({ createdAt: -1 }).limit(10);
    }
}
