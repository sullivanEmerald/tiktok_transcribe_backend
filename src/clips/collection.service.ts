// collection.service.ts
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Collection, ICollection } from './schema/collection.schema';
import { Clip } from './schema/clip.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionService {
    constructor(
        @InjectModel(Collection.name) private collectionModel: Model<ICollection>,
        @InjectModel(Clip.name) private clipModel: Model<any>,
    ) { }

    async create(userId: string, dto: CreateCollectionDto) {
        try {
            const userNewCollection = await this.collectionModel.create({
                userId: userId,
                name: dto.name,
            });
            return {
                _id: userNewCollection._id,
                name: userNewCollection.name
            }
        } catch (err: any) {
            if (err.code === 11000) {
                throw new ConflictException('A collection with this name already exists');
            }
            throw err;
        }
    }

    async findAllForUser(userId: string) {
        const userCollections = await this.collectionModel
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .lean();
        return userCollections.map(collection => ({
            _id: collection._id,
            name: collection.name,
        }));
    }

    async findOne(userId: string, collectionId: string) {
        const collection = await this.collectionModel.findOne({
            _id: collectionId,
            userId: userId,
        });
        if (!collection) throw new NotFoundException('Collection not found');
        return collection;
    }

    async rename(userId: string, collectionId: string, name: string) {
        const collection = await this.findOne(userId, collectionId);
        collection.name = name;
        return collection.save();
    }

    async remove(userId: string, collectionId: string) {
        await this.findOne(userId, collectionId); // ownership check

        // Unassign clips rather than deleting them
        await this.clipModel.updateMany(
            { collectionId: new Types.ObjectId(collectionId) },
            { $set: { collectionId: null } },
        );

        return this.collectionModel.deleteOne({ _id: collectionId });
    }
}