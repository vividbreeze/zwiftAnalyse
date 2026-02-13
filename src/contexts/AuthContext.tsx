import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
    email: string;
    name: string;
    picture?: string;
    sub: string; // Google user ID
}

interface AuthContextType {
    user: GoogleUser | null;
    isAuthenticated: boolean;
    login: (credentialResponse: CredentialResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'zwift_dashboard_auth';

interface AuthProviderProps {
    children: ReactNode;
    allowedEmails?: string[]; // Optional: restrict to specific email addresses
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, allowedEmails }) => {
    const [user, setUser] = useState<GoogleUser | null>(null);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth) {
            try {
                const parsed = JSON.parse(savedAuth);
                // Check if auth is still valid (simple check - you could add expiration)
                if (parsed.user) {
                    setUser(parsed.user);
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
                localStorage.removeItem(AUTH_STORAGE_KEY);
            }
        }
    }, []);

    const login = (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            console.error('No credential in response');
            return;
        }

        try {
            // Decode JWT token from Google
            const decoded: any = jwtDecode(credentialResponse.credential);

            const googleUser: GoogleUser = {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
                sub: decoded.sub
            };

            // Check if email is allowed (if restrictions are set)
            if (allowedEmails && allowedEmails.length > 0) {
                if (!allowedEmails.includes(googleUser.email)) {
                    alert(`Access denied. Your email (${googleUser.email}) is not authorized.`);
                    return;
                }
            }

            // Save to state and localStorage
            setUser(googleUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                user: googleUser,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error decoding Google credential:', error);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
