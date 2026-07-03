import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private prisma: PrismaService) { }

    @Post('sync')
    // @UseGuards(FirebaseAuthGuard)
    async syncUser(@Req() req) {
        // Upsert guarantees the user is created if they are missing
        return this.prisma.user.upsert({
            where: { id: req.user.id },
            update: {}, // Do nothing if they already exist
            create: {
                id: req.user.id,
                email: req.user.email || 'user@example.com',
            },
        });
    }
}