import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- 1. Import Prisma

@Module({
  providers: [AuthService, PrismaService], // <-- 2. Inject Prisma here
  controllers: [
    AuthController
  ]
})
export class AuthModule { }