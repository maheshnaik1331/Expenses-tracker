import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeApp, getApps, cert } from 'firebase-admin/app'; // Modular imports

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize Firebase Admin securely using the modular syntax
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newline characters so the key formats correctly
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  // Explicit CORS configuration
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();