import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Lock, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation states for UI feedback
  const passwordsMatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return true;
    return newPassword.trim() === confirmPassword.trim();
  }, [newPassword, confirmPassword]);

  const isDifferentFromCurrent = useMemo(() => {
    if (!currentPassword || !newPassword) return true;
    return currentPassword.trim() !== newPassword.trim();
  }, [currentPassword, newPassword]);

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cur = currentPassword.trim();
    const next = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!cur || !next || !conf) {
      toast.error('All fields are required');
      return;
    }

    if (next.length < minLen) {
      toast.error(`New password must be at least ${minLen} characters`);
      return;
    }

    if (next !== conf) {
      toast.error('The new password and its confirmation do not match. Please re-type them carefully.');
      return;
    }

    if (cur === next) {
      toast.error('Your new password must be different from your current one for security.');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        '/api/auth/change-password',
        { currentPassword: cur, newPassword: next },
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
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwd-modal-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
          
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 id="pwd-modal-title" className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  Security Update
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Change account password</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="pwd-current" className="ml-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="pwd-current"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  required
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwd-new" className="ml-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                New Password
              </label>
              <div className="relative">
                <input
                  id="pwd-new"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full rounded-2xl border ${!isDifferentFromCurrent ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'} px-5 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10`}
                  required
                  placeholder="Enter new password"
                  minLength={minLen}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isDifferentFromCurrent && (
                <p className="flex items-center gap-1.5 ml-1 text-[10px] font-bold text-amber-600 uppercase">
                  <AlertCircle size={12} /> Same as current password
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwd-confirm" className="ml-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="pwd-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-2xl border ${!passwordsMatch ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'} px-5 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10`}
                  required
                  placeholder="Re-type new password"
                  minLength={minLen}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   {confirmPassword && (
                     passwordsMatch ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />
                   )}
                   <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {!passwordsMatch && confirmPassword && (
                <p className="flex items-center gap-1.5 ml-1 text-[10px] font-bold text-red-500 uppercase">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <button
                type="submit"
                disabled={saving || !passwordsMatch || !isDifferentFromCurrent}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                {saving ? 'Updating Security…' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel and Dismiss
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PasswordChangeModal;
