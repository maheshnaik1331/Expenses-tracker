import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    // Syncs the Firebase UID into your PostgreSQL Database
    async syncFirebaseUser(data: { id: string; email: string; firstName?: string; lastName?: string }) {
        return this.prisma.user.upsert({
            where: { id: data.id },
            update: {}, // If they already exist, do nothing safely
            create: {
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
            },
        });
    }
}