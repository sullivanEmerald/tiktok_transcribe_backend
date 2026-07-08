import { Injectable, ConflictException, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { CacheService } from 'src/common/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REGISTER_EVENTS } from './events/register.type';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { RefreshToken, RefreshTokenDocument } from './schema/refreshToken.schema';
import { addDays } from 'date-fns';
import type { Response } from 'express';


@Injectable()
export class AuthService {
    constructor(
        private readonly cacheService: CacheService,
        private readonly emitter: EventEmitter2,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    ) { }


    private generateVerificationToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }


    async register(registerDto: RegisterDto) {
        const { email, password, ...rest } = registerDto;
        const existing = await this.usersService.findByEmail({ email });
        if (existing) {
            throw new ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const token = this.generateVerificationToken();
        const ttlSeconds = 24 * 60 * 60;

        // store intending user in the cache memory with the verification token and expiration
        const cacheKey = `user_verification:${token}`;
        await this.cacheService.set(cacheKey, { userData: { email, password: hashedPassword, ...rest } }, ttlSeconds);

        await this.cacheService.set(`user_verification_email:${email}`, token, ttlSeconds);

        this.emitter.emit(REGISTER_EVENTS.CREATED, { email, token });

        return HttpStatus.CREATED;
    }

    async verifyEmail(token: string) {
        const cacheKey = `user_verification:${token}`;
        const cached = await this.cacheService.get(cacheKey);

        if (!cached) {
            throw new BadRequestException('Invalid or expired verification token');
        }


        const { userData } = cached;

        const user = await this.usersService.create(userData);
        await this.cacheService.del(cacheKey);

        return HttpStatus.OK;
    }

    async resendVerification(email: string) {
        const existingUser = await this.usersService.findByEmail({ email });
        if (existingUser) {
            throw new ConflictException('This email is already verified. Please log in.');
        }

        const oldToken = await this.cacheService.get(`user_verification_email:${email}`);
        if (!oldToken) {
            throw new BadRequestException(
                'No pending registration found for this email. Please sign up again.',
            );
        }

        const pendingData = await this.cacheService.get(`user_verification:${oldToken}`);
        if (!pendingData) {
            throw new BadRequestException(
                'No pending registration found for this email. Please sign up again.',
            );
        }

        // invalidate the old token so it can't be used after this point
        await this.cacheService.del(`user_verification:${oldToken}`);

        const newToken = this.generateVerificationToken();
        const ttlSeconds = 24 * 60 * 60;

        await this.cacheService.set(`user_verification:${newToken}`, pendingData, ttlSeconds);
        await this.cacheService.set(`user_verification_email:${email}`, newToken, ttlSeconds);

        this.emitter.emit(REGISTER_EVENTS.CREATED, { email, token: newToken });

        return { message: 'Verification email resent. Please check your inbox.' };
    }


    async issueTokens(user) {
        const accessToken = this.jwtService.sign(
            { sub: user._id.toString() },
            {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN')
            },
        );

        const refreshToken = randomBytes(40).toString('hex');
        const tokenHash = await bcrypt.hash(refreshToken, 10);

        await this.refreshTokenModel.create({
            tokenHash,
            userId: user._id,
            expiresAt: addDays(new Date(), 7),
        });

        return { accessToken, refreshToken };
    }

    async login(dto: { email: string; password: string }) {
        const { email, password } = dto;
        const user = await this.usersService.findByEmail({ email });
        if (!user) {
            throw new UnauthorizedException('Invalid User Credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid User Credentials');
        }
        const { accessToken, refreshToken } = await this.issueTokens(user);
        return { accessToken, refreshToken, user: { id: user._id, email: user.email } };
    }


    setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
        console.log("refreshToken", refreshToken)
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    async rotateRefreshToken(oldToken: string) {
        const candidates = await this.refreshTokenModel.find({ revoked: false });
        const match = await this.findMatchingToken(candidates, oldToken);

        if (!match) throw new UnauthorizedException('Invalid refresh token');
        if (match.expiresAt < new Date()) throw new UnauthorizedException('Expired refresh token');

        match.revoked = true;
        await match.save();

        const user = await this.usersService.findById(match.userId.toString());
        return this.issueTokens(user);
    }

    private async findMatchingToken(candidates: RefreshTokenDocument[], raw: string) {
        for (const c of candidates) {
            if (await bcrypt.compare(raw, c.tokenHash)) return c;
        }
        return null;
    }


    async getProfile(userId: string) {
        const user = await this.usersService.findById(userId)
        if (!user) {
            throw new UnauthorizedException('User not found')
        }
        return {
            id: user._id,
            firstName: user.firstName,
            email: user.email
        }
    }


}
