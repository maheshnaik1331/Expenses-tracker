import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        console.log('\n--- DEBUG: INCOMING API REQUEST ---');
        console.log(`Endpoint: ${request.method} ${request.url}`);
        console.log('1. Auth Header Present?', authHeader ? 'Yes' : 'No');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('❌ FAILED: Missing or malformed Bearer token.');
            throw new UnauthorizedException('Missing or invalid authentication token.');
        }

        const token = authHeader.split(' ')[1];
        console.log('2. Token Extracted:', token.substring(0, 15) + '...');

        try {
            console.log('3. Sending token to Firebase Admin for verification...');
            const decodedToken = await getAuth().verifyIdToken(token);

            console.log('✅ SUCCESS: Token verified by Firebase Admin.');
            console.log('User UID:', decodedToken.uid);

            request.user = { id: decodedToken.uid, email: decodedToken.email };
            return true;

        } catch (error: any) {
            console.error('\n❌ FIREBASE ADMIN ERROR ❌');
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);

            // Specifically check if the error is related to initialization
            if (error.code === 'app/no-app') {
                console.error('CRITICAL: Firebase Admin SDK is not initialized in main.ts!');
            }

            throw new UnauthorizedException('Session expired or invalid token.');
        }
    }
}