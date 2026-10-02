
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, ArrowRight, Loader2, Sparkles, X, Lock } from 'lucide-react';
import { saveUserProfile, getUserProfile } from '../services/storageService';
import { UserProfile } from '../types';
import { auth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../services/firebase';

interface AuthModalProps {
  onComplete: (user: UserProfile) => void;
  onCancel: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onComplete, onCancel }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profile = await getUserProfile();
      if (profile) {
          onComplete(profile);
      } else {
          // If new user from Google, create a basic profile
          const newUser: UserProfile = {
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              joinedDate: new Date().toISOString(),
              avatarUrl: user.photoURL || undefined
          };
          await saveUserProfile(newUser);
          onComplete(newUser);
      }
    } catch (err: any) {
      console.error("Google auth error:", err);
      setError(err.message || "Google authentication failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
        if (isLogin) {
            // LOGIN FLOW
            await signInWithEmailAndPassword(auth, email, password);
            const profile = await getUserProfile();
            if (profile) {
                onComplete(profile);
            } else {
                // Fallback if profile doesn't exist but auth succeeded (shouldn't happen ideally)
                 const newUser: UserProfile = {
                    name: email.split('@')[0],
                    email: email,
                    joinedDate: new Date().toISOString()
                };
                await saveUserProfile(newUser);
                onComplete(newUser);
            }
        } else {
            // SIGN UP FLOW
            if (!name.trim()) {
                throw new Error("Name is required");
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("Please enter a valid email address");
            }

            // Strong password validation
            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters long");
            }
            if (!/[A-Z]/.test(password)) {
                throw new Error("Password must contain at least one uppercase letter");
            }
            if (!/[0-9]/.test(password)) {
                throw new Error("Password must contain at least one number");
            }
            if (!/[!@#$%^&*]/.test(password)) {
                throw new Error("Password must contain at least one special character (!@#$%^&*)");
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            if (user) {
                const newUser: UserProfile = {
                    name: name,
                    email: email,
                    joinedDate: new Date().toISOString()
                };
                await saveUserProfile(newUser);
                onComplete(newUser);
            }
        }
    } catch (err: any) {
        console.error("Auth error:", err);
        let errorMessage = err.message || "Authentication failed";
        
        // Handle specific Firebase errors
        if (errorMessage.includes("auth/email-already-in-use")) {
            errorMessage = "Email is already in use. Please login instead.";
        } else if (errorMessage.includes("auth/wrong-password") || errorMessage.includes("auth/user-not-found") || errorMessage.includes("auth/invalid-credential")) {
            errorMessage = "Invalid email or password.";
        } else if (errorMessage.includes("auth/weak-password")) {
            errorMessage = "Password should be at least 6 characters.";
        }

        setError(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[95vh] overflow-y-auto no-scrollbar animate-slide-up relative ring-1 ring-white/20">
        
        {/* Close Button */}
        <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-20 transition-colors"
        >
            <X size={18} />
        </button>

        {/* Decorative header */}
        <div className="bg-stone-900 pt-8 pb-6 px-6 text-center relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-pulse-slow"></div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20 shadow-xl">
                <Sparkles className="text-sage-300" size={20} />
            </div>
            <h2 className="font-serif text-2xl text-white font-bold tracking-tight">
                {isLogin ? 'Welcome Back' : 'Start Your Journey'}
            </h2>
            <p className="text-stone-400 text-[10px] mt-1.5 font-bold tracking-widest uppercase">
                {isLogin ? 'Login to Continue' : 'Save Scans & Track Progress'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
            {error && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 mb-2">
                    {error}
                </div>
            )}

            {!isLogin && (
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Your Name</label>
                    <div className="relative group">
                        <User className="absolute left-3.5 top-3 text-stone-400 group-focus-within:text-sage-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dr. Lumiere"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-stone-900 focus:ring-2 focus:ring-sage-200 focus:border-sage-300 outline-none transition-all placeholder:text-stone-300"
                            required={!isLogin}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                    <Mail className="absolute left-3.5 top-3 text-stone-400 group-focus-within:text-sage-500 transition-colors" size={16} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-stone-900 focus:ring-2 focus:ring-sage-200 focus:border-sage-300 outline-none transition-all placeholder:text-stone-300"
                        required
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-3.5 top-3 text-stone-400 group-focus-within:text-sage-500 transition-colors" size={16} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-stone-900 focus:ring-2 focus:ring-sage-200 focus:border-sage-300 outline-none transition-all placeholder:text-stone-300"
                        required
                        minLength={6}
                    />
                </div>
            </div>

            <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-stone-900 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <span className="flex items-center gap-2 text-sm">
                        {isLogin ? 'Login' : 'Create Profile'} <ArrowRight size={16} />
                    </span>
                )}
            </button>

            <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-stone-400 font-bold tracking-widest">Or continue with</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-stone-200 text-stone-700 rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all hover:border-stone-300 shadow-sm text-sm"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google
            </button>
            
            <div className="flex flex-col gap-1 mt-3">
                <button 
                    type="button" 
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full text-center text-xs text-stone-500 hover:text-stone-800 font-bold tracking-wide py-1"
                >
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
                
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="w-full text-center text-[10px] text-stone-400 hover:text-stone-600 font-bold tracking-wide uppercase py-1"
                >
                    Cancel
                </button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
