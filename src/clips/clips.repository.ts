import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Clip, ClipDocument } from './schema/clip.schema';
import { CreateClipDto } from './dto/create-clip.dto';

@Injectable()
export class ClipsRepository {
    constructor(
        @InjectModel(Clip.name) private clipModel: Model<ClipDocument>,
    ) { }

    async create(data: CreateClipDto, userId: string) {
        const objectId = new Types.ObjectId(userId)
        const clip = new this.clipModel({ ...data, userId: objectId });
        return clip.save();
    }

    async findById(id: string) {
        return this.clipModel.findById(id);
    }

    async findByUserId(userId: string) {
        return this.clipModel.find({ userId }).sort({ createdAt: -1 }).limit(15);
    }

    async update(id: string, update: Partial<Clip>) {
        return this.clipModel.findByIdAndUpdate(id, update, { new: true });
    }

    async delete(id: string) {
        return this.clipModel.findByIdAndDelete(id);
    }

    // New: generic find with pagination options
    async find(filter: any = {}, options?: { offset?: number; limit?: number }) {
        console.log("filtering payload", JSON.stringify(filter, null, 2));
        const clips = this.clipModel.find(filter).sort(filter.$text ? { score: { $meta: 'textScore' } } : { createdAt: -1 });
        if (options?.limit) clips.limit(options.limit);
        if (options?.offset) clips.skip(options.offset);
        return clips.exec();
    }

    async findOne(clipId: string | undefined, userId: string) {

        if (!clipId) return null;

        const objectId = new Types.ObjectId(userId)

        return await this.clipModel.findOne({
            _id: clipId,
            userId: objectId,
        });
    }

    async deleteClip(clipId: string, userId: string) {
        return await this.clipModel.deleteOne({
            _id: clipId,
            userId: userId,
        });
    }
}
