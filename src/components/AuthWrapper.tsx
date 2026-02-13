import React, { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../contexts/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface AuthWrapperProps {
    children: ReactNode;
}

/**
 * Wrapper component that provides Google OAuth and Auth context
 * Must be inside SettingsProvider to access googleClientId
 */
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const { settings } = useSettings();

    // If no Google Client ID is configured, skip OAuth protection
    // This allows the app to work without authentication during initial setup
    if (!settings.googleClientId) {
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={settings.googleClientId}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};

export default AuthWrapper;
