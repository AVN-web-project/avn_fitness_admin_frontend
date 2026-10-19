import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import Button from '../../components/common/Button.jsx';

/**
 * Lands here from the password-reset email: /reset-password?resetToken=...&email=...
 * The token is single-use and expires after 30 minutes.
 */
export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAdminAuth();

  const token = params.get('resetToken') || params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email, token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not reset your password. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  const linkIsUsable = Boolean(token && email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-slate-950/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Set a New Password</h2>
          {email && <p className="mt-2 text-xs text-slate-400">{email}</p>}
        </div>

        {!linkIsUsable && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>This reset link is missing its token. Please request a new one from the login page.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="space-y-5">
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>Your password has been reset. You can now sign in with it.</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go to Sign In
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  disabled={!linkIsUsable}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  disabled={!linkIsUsable}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Re-enter the new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!linkIsUsable}
              className="w-full"
            >
              Reset Password
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
