import { Controller, Post, Body, Get, Query, Res, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get("verify-email")
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('resend-verification-email')
    async resendVerification(@Body() dto: { email: string }) {
        return this.authService.resendVerification(dto.email);
    }

    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { accessToken, refreshToken, user } = await this.authService.login(dto);
        this.authService.setAuthCookies(res, accessToken, refreshToken);
        return { user };
    }

    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        console.log('refreshing')
        const oldToken = req.cookies['refreshToken'];
        if (!oldToken) throw new UnauthorizedException();
        const { accessToken, refreshToken } = await this.authService.rotateRefreshToken(oldToken);
        this.authService.setAuthCookies(res, accessToken, refreshToken);
        return { ok: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@CurrentUser() userId: string) {
        return this.authService.getProfile(userId)
    }
}
