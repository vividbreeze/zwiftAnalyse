import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Activity, TrendingUp, Heart, Zap } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* App Branding */}
                <div className="text-center mb-8">
                    <div className="flex justify-center gap-2 mb-4">
                        <Activity className="w-12 h-12 text-orange-500" />
                        <TrendingUp className="w-12 h-12 text-blue-500" />
                        <Heart className="w-12 h-12 text-red-500" />
                        <Zap className="w-12 h-12 text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Zwift Training Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Dein persönliches Training Analytics & Coaching Tool
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                        Willkommen zurück!
                    </h2>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                        Melde dich mit deinem Google-Konto an
                    </p>

                    {/* Google Sign-In Button */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={login}
                            onError={() => {
                                console.error('Login failed');
                                alert('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
                            }}
                            useOneTap
                            auto_select={false}
                        />
                    </div>

                    {/* Info Text */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            Durch die Anmeldung stimmst du der Nutzung deiner Google-Kontodaten zu.
                            Deine Trainingsdaten bleiben privat und werden nur lokal gespeichert.
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white bg-opacity-60 rounded-lg p-3">
                        <Activity className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                        <p className="text-xs font-medium text-gray-700">Strava Integration</p>
                    </div>
                    <div className="bg-white bg-opacity-60 rounded-lg p-3">
                        <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs font-medium text-gray-700">AI Coaching</p>
                    </div>
                    <div className="bg-white bg-opacity-60 rounded-lg p-3">
                        <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
                        <p className="text-xs font-medium text-gray-700">Withings Daten</p>
                    </div>
                    <div className="bg-white bg-opacity-60 rounded-lg p-3">
                        <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                        <p className="text-xs font-medium text-gray-700">Workout Empfehlungen</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
