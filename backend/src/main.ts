import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import './firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so your Vercel frontend can talk to this backend safely
  app.enableCors({
    origin: '*', // In production, you can replace this with your frontend's Vercel URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Vercel handles the port automatically in serverless environments, 
  // but we keep 4000 as a fallback for your local machine
  const port = process.env.PORT || 4000;
  await app.listen(port);
}
bootstrap();