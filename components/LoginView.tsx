import React, { useState } from 'react';
import { loginWithGoogle, loginWithApple, signInAnonymously, auth } from '../services/firebase';

interface LoginViewProps {
  onLoginStateChange: (loading: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginStateChange }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleLogin = async () => {
    if (isAuthenticating) return;
    setErrorMsg(null);
    setIsAuthenticating(true);
    onLoginStateChange(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Google Login Error:", error);
      setErrorMsg(error.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setIsAuthenticating(false);
      onLoginStateChange(false);
    }
  };

  const handleAppleLogin = async () => {
    if (isAuthenticating) return;
    setErrorMsg(null);
    setIsAuthenticating(true);
    onLoginStateChange(true);
    try {
      await loginWithApple();
    } catch (error: any) {
      console.error("Apple Login Error:", error);
      setErrorMsg(error.message || "Failed to sign in with Apple. Please try again.");
    } finally {
      setIsAuthenticating(false);
      onLoginStateChange(false);
    }
  };

  const handleGuestLogin = async () => {
    if (isAuthenticating) return;
    setErrorMsg(null);
    setIsAuthenticating(true);
    onLoginStateChange(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Guest Sign In Error:", error);
      setErrorMsg(error.message || "Failed to sign in as Guest. Please try again.");
    } finally {
      setIsAuthenticating(false);
      onLoginStateChange(false);
    }
  };

  return (
    <div id="login-container" className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black overflow-hidden">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Branding & Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-3xl tracking-tighter text-white">SV</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-100 to-white bg-clip-text text-transparent">
              StyleVision AI
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Virtual Hairstyles & Beards Try-On
            </p>
          </div>
        </div>

        {/* Promo Message */}
        <div className="text-xs text-neutral-300 leading-relaxed px-4">
          Sign in using your social profile to synchronize your custom generated styling previews across all your Apple devices automatically.
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="w-full py-2.5 px-4 bg-red-500/15 border border-red-500/30 rounded-xl text-[11px] text-red-400 font-medium text-center animate-in fade-in slide-in-from-top-1">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col space-y-3.5">
          {/* Google Sign In */}
          <button
            id="login-google-button"
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3.5 py-3.5 px-6 rounded-2xl bg-white text-black hover:bg-neutral-100 active:scale-[0.98] transition-all font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
          >
            {/* Google Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.58c-.28 1.48-1.12 2.74-2.38 3.59v2.98h3.85c2.26-2.09 3.69-5.17 3.69-8.42z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.85-2.98c-1.08.72-2.45 1.16-4.11 1.16-3.17 0-5.85-2.14-6.81-5.02H1.19v3.08C3.18 21.3 7.28 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.19 14.25c-.24-.72-.38-1.49-.38-2.25s.14-1.53.38-2.25V6.67H1.19C.38 8.27 0 10.08 0 12s.38 3.73 1.19 5.33l4-3.08z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.28 0 3.18 2.7 1.19 6.67l4 3.08c.96-2.88 3.64-5 6.81-5z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Apple Sign In */}
          <button
            id="login-apple-button"
            onClick={handleAppleLogin}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3.5 py-3.5 px-6 rounded-2xl bg-black border border-white/20 text-white hover:bg-neutral-900 active:scale-[0.98] transition-all font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
          >
            {/* Apple Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.37-6.15-2.82-2.27-6.65-6.73-11.48-13.39-9.52-13.1-16.7-27.91-21.53-44.44-4.83-16.53-7.25-32.06-7.25-46.6 0-16.03 4.2-29.41 12.6-40.16 8.4-10.75 18.99-16.19 31.76-16.31 6.3 0 12.63 1.7 18.99 5.09 6.36 3.39 10.99 5.09 13.88 5.09 2.56 0 7-1.76 13.32-5.27 6.33-3.51 12.26-5.14 17.8-4.89 12.92.51 23.46 5.16 31.64 13.95 8.18 8.79 13.18 19.53 15 32.22-13.8 5.65-20.73 14.54-20.81 26.67-.08 9.77 3.44 18.06 10.57 24.87 7.12 6.81 15.6 10.45 25.43 10.92-.08 1.93-.32 4.41-.71 7.42-.4 3.01-.84 5.92-1.34 8.73zM119.22 3.24c0 7.84-2.82 15.11-8.47 21.81-5.65 6.7-12.44 11.23-20.37 13.58.12-1.54.18-3.08.18-4.6 0-8.24-3.01-16.08-9.03-22.52-6.02-6.44-13.25-10.95-21.69-13.54 1.15-2.45 2.65-4.99 4.51-7.62 1.86-2.63 4.2-5.14 7.02-7.53 5.92-5.02 12.72-7.85 20.39-8.48 7.68-.63 14.54 1.45 20.61 6.25 5.66 4.39 9.17 9.87 10.52 16.42 1.34 6.55 2.01 12.12 2.01 16.7z" />
            </svg>
            <span>Continue with Apple</span>
          </button>

          <div className="flex items-center my-2">
            <div className="h-px bg-white/10 flex-grow"></div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest px-3">or</span>
            <div className="h-px bg-white/10 flex-grow"></div>
          </div>

          {/* Continue as Guest */}
          <button
            id="login-guest-button"
            onClick={handleGuestLogin}
            disabled={isAuthenticating}
            className="w-full py-3 px-6 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white active:scale-[0.98] transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50"
          >
            Continue as Guest
          </button>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isAuthenticating && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3 shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
          <p className="text-white text-xs font-semibold tracking-wider uppercase animate-pulse">Authenticating...</p>
        </div>
      )}

    </div>
  );
};
