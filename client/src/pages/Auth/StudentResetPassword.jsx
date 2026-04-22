import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

/**
 * Public page opened from email link — sets a new password using a one-time JWT token.
 */
const StudentResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!tokenFromUrl) {
      setError('Missing reset link. Open the link from your email or request a new reset from the login page.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/student/reset-password', {
        token: tokenFromUrl,
        newPassword,
      });
      if (res.data.success) {
        setDone(true);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 py-10">
      <Link
        to="/login"
        className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-xl border border-gray-100 bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-600 shadow-sm backdrop-blur-md hover:bg-white"
      >
        ← Back to login
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-800">Set new password</h1>
          <p className="mt-1 text-sm text-gray-500">Student account — email verification link</p>
        </div>

        {!tokenFromUrl && !done ? (
          <p className="text-center text-sm text-red-600">
            This page needs a valid link from your reset email.{' '}
            <Link to="/login" className="font-semibold text-blue-600 underline">
              Go to login
            </Link>{' '}
            and use &quot;Forgot password?&quot;.
          </p>
        ) : done ? (
          <p className="text-center text-sm font-medium text-emerald-700">
            Password updated. Redirecting to login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <p className="mt-1 text-[10px] text-gray-400">Minimum 6 characters.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentResetPassword;
