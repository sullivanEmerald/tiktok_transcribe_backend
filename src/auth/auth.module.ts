import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { CacheService } from 'src/common/cache.service';
import { MailModule } from 'src/mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthEventsHandler } from './events/register.events';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from './schema/refreshToken.schema';


@Module({

  providers: [AuthService, CacheService, AuthEventsHandler, JwtStrategy],
  controllers: [AuthController],
  imports: [
    UsersModule,
    MailModule,
    EventEmitterModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRES_IN') },
      }),
    }),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema }
    ])
  ]
})
export class AuthModule { }



