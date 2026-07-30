import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';

// replace ES import with require to avoid "cookieParser is not a function" issues
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.use(cookieParser());
  const frontendUrl = process.env.FRONTEND_URL || 'https://useclipscript.com';
  const devUrl = 'http://localhost:3000';
  const subDomain = "https://www.useclipscript.com"
  app.enableCors({
    origin: [frontendUrl, devUrl, subDomain],
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });
  // Set up the Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  app.set('trust proxy', true);
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
