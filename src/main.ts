import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const frontendUrl = process.env.FRONTEND_URL || 'https://tiktok-transcribe-frontend.vercel.app';
  const devUrl = 'http://localhost:3000';
  app.enableCors({
    origin: [frontendUrl, devUrl],
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
