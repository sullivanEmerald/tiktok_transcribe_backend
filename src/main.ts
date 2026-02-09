import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendUrl || '*',
    credentials: true,
  });
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
