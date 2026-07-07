import {
    Injectable,
    NestMiddleware,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GuestMiddleware implements NestMiddleware {
    constructor(private readonly usersService: UsersService) { }

    async use(
        req: Request & { user?: any },
        res: Response,
        next: () => void,
    ) {

        console.log('cookie header', req.headers.cookie);
        console.log('cookies', req.cookies);
        let guestId = req.cookies?.guest_id;

        console.log('GuestMiddleware - incoming request with guest_id:', guestId);

        if (!guestId) {
            guestId = randomUUID();
            console.log('NODE_ENV', process.env.NODE_ENV);
            // const guestUser = await this.usersService.createGuestUser(guestId);
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('guest_id', guestId, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                maxAge: 1000 * 60 * 60 * 24 * 365,
                path: '/',

            });
            // req.user = guestUser;
            return next();
        }

        const existingUser = await this.usersService.findByGuestId(guestId);
        if (!existingUser) {
            // const guestUser = await this.usersService.createGuestUser(guestId);
            // req.user = guestUser;
            return next();
        }

        req.user = existingUser;
        next();
    }
}
