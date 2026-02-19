import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Always allow the deployed frontend URL for CORS
  const frontendUrl = process.env.FRONTEND_URL || 'https://tiktok-transcribe-frontend.vercel.app';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
