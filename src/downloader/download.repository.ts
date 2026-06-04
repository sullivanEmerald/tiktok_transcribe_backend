import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Download } from './schema/download.schema';

@Injectable()
export class DownloadRepository {
    constructor(@InjectModel(Download.name) private downloadModel: Model<Download>) { }

    async create(data: { guestId: string; videoUrl: string; title?: string; downloadUrl?: string; ip: string }) {
        return this.downloadModel.create(data);
    }

    async findByGuestId(guestId: string) {
        return this.downloadModel.find({ guestId }).sort({ createdAt: -1 });
    }
}
