import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/api/auth';
import { Flame, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({ email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] text-zinc-100 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-2xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-xl shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
              <p className="text-xs text-zinc-400 mt-1">Register for ServerForge Game Control Plane</p>
            </div>
          </div>

          {/* Alert Error Box */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Alert Success Box */}
          {success && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Account created successfully! Redirecting to sign in...</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4 text-zinc-500" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4 text-zinc-500" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4 text-zinc-500" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-semibold shadow-indigo-500/25 text-sm"
              icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              Create Account
            </Button>
          </form>

          {/* Link to Login */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
