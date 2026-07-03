"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null); // Instantly clears the UI state for a snappier feel
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    useEffect(() => {
        console.log("🛡️ Initializing Firebase Auth Listener...");

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                console.log("✅ Firebase User Detected UID:", firebaseUser.uid);
                setUser(firebaseUser);

                try {
                    console.log("🔄 Pinging NestJS Backend to Sync Postgres Database...");
                    // Calls your backend exact route as confirmed by your boot logs
                    await api.post('/auth/sync');
                    console.log("✅ User successfully synced with PostgreSQL Database!");
                } catch (error) {
                    console.error("❌ Postgres Sync Failed. The backend might be offline or route is mismatched:", error);
                }
            } else {
                console.log("👋 No active Firebase session. Clearing user state.");
                setUser(null);
            }
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to cleanly consume auth context anywhere in the app
export const useAuth = () => useContext(AuthContext);