import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Lock, Loader2 } from 'lucide-react';

/**
 * Modal to change the logged-in user's password (cookie session).
 * College accounts allow a shorter minimum length (3) than admin/student (6).
 */
const PasswordChangeModal = ({ open, onClose, role = 'student' }) => {
  const minLen = role === 'college' ? 3 : 6;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(
        '/api/auth/change-password',
        { currentPassword, newPassword },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Password updated successfully');
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwd-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Lock size={22} strokeWidth={2} />
            </div>
            <div>
              <h2 id="pwd-modal-title" className="text-lg font-black text-blue-950">
                Change login password
              </h2>
              <p className="text-xs font-medium text-slate-500">Enter your current password, then choose a new one.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pwd-current" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current password
            </label>
            <input
              id="pwd-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none ring-blue-500/0 transition-shadow focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              required
            />
          </div>
          <div>
            <label htmlFor="pwd-new" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              New password
            </label>
            <input
              id="pwd-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={minLen}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              required
            />
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              {role === 'college' ? 'Minimum 3 characters (college).' : 'Minimum 6 characters.'}
            </p>
          </div>
          <div>
            <label htmlFor="pwd-confirm" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Confirm new password
            </label>
            <input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={minLen}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              required
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-blue-900/10 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
