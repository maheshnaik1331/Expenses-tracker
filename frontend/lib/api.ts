import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
});

api.interceptors.request.use(
    async (config) => {
        // 1. CRITICAL FIX: Force Axios to wait until Firebase has fully initialized
        await auth.authStateReady();

        // 2. Grab the current user securely
        const user = auth.currentUser;

        if (user) {
            // 3. Fetch the token
            const token = await user.getIdToken();
            console.log("✅ Token successfully attached for:", config.url);

            // 4. Set the header
            config.headers.set('Authorization', `Bearer ${token}`);
        } else {
            console.warn(`⚠️ Warning: Request to ${config.url} sent without token.`);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;