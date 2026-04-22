import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col pointer-events-auto">
      <div className="bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-xl p-4 flex items-center gap-4 min-w-[340px] relative overflow-hidden animate-in slide-in-from-right-full fade-in duration-500">
        <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-gray-700">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 w-full animate-progress-shrink origin-left"></div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .animate-progress-shrink {
          animation: progress-shrink 3000ms linear forwards;
        }
      `}} />
    </div>
  );
};

const Login = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  /** Student only: login | forgot | forgotSent */
  const [studentLoginView, setStudentLoginView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSentDevLink, setForgotSentDevLink] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const roleConfigs = {
    admin: {
      title: 'Admin Login',
      bgColor: 'from-purple-50 via-white to-pink-50',
      accentColor: 'purple',
      gradient: 'from-purple-600 to-purple-700',
      tabActive: 'bg-purple-50 text-purple-600 border-purple-400',
      target: '/admin/dashboard'
    },
    college: {
      title: 'College Login',
      bgColor: 'from-emerald-50 via-white to-teal-50',
      accentColor: 'emerald',
      gradient: 'from-emerald-600 to-emerald-700',
      tabActive: 'bg-emerald-50 text-emerald-600 border-emerald-400',
      target: '/college/dashboard'
    },
    student: {
      title: 'Student Login',
      bgColor: 'from-blue-50 via-white to-indigo-50',
      accentColor: 'blue',
      gradient: 'from-blue-600 to-blue-700',
      tabActive: 'bg-blue-50 text-blue-600 border-blue-400',
      target: '/student/apply'
    }
  };

  const config = roleConfigs[role];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setToast({ message: "Please fill in all fields", type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        identifier: formData.identifier,
        password: formData.password,
        role: role
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setToast({ message: `Welcome back, ${response.data.user.name}! Redirecting...`, type: 'success' });
        setTimeout(() => navigate(config.target), 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const emailTrim = forgotEmail.trim();
    if (!emailTrim) {
      setToast({ message: 'Enter the email you used when registering.', type: 'error' });
      return;
    }
    setForgotLoading(true);
    setForgotSentDevLink('');
    try {
      const res = await axios.post('/api/auth/student/forgot-password', { email: emailTrim });
      if (res.data.success) {
        setStudentLoginView('forgotSent');
        if (res.data.devResetLink && import.meta.env.DEV) {
          setForgotSentDevLink(res.data.devResetLink);
        }
        setToast({
          message: res.data.devHint ? `${res.data.message} (See dev link below.)` : res.data.message,
          type: 'success',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send reset email. Try again.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 py-10 relative overflow-hidden bg-gradient-to-br transition-all duration-700 ease-in-out ${config.bgColor}`}>
      
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}

      {/* Home Navigation Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl shadow-sm text-gray-600 hover:text-black hover:bg-white transition-all group active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001-1m-6 0h6" />
        </svg>
        <span className="text-sm font-bold uppercase tracking-wider">Home</span>
      </button>

      {/* Role Tabs */}
      <div className="relative z-10 mb-8 p-1 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-full flex items-center shadow-sm">
        {Object.keys(roleConfigs).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setRole(tab);
              setFormData({ identifier: '', password: '' });
              setStudentLoginView('login');
              setForgotEmail('');
              setForgotSentDevLink('');
            }}
            className={`px-6 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 capitalize relative ${
              role === tab ? `${roleConfigs[tab].tabActive} shadow-sm border-b-2` : 'text-gray-500 bg-transparent hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/85 backdrop-blur-sm border border-gray-100 ring-1 ring-black/5 shadow-[0_10px_25px_rgba(0,0,0,0.05)] rounded-2xl p-6 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 tracking-tight mb-1 capitalize">
              {role === 'student' && studentLoginView === 'forgot'
                ? 'Reset password'
                : role === 'student' && studentLoginView === 'forgotSent'
                  ? 'Check your email'
                  : config.title}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {role === 'student' && studentLoginView === 'forgot'
                ? 'Enter your registered email — we will send a verification link to reset your password.'
                : role === 'student' && studentLoginView === 'forgotSent'
                  ? 'Use the link we sent to set a new password (valid for 1 hour).'
                  : 'Access your DOTE portal'}
            </p>
          </div>

          {role === 'student' && studentLoginView === 'forgotSent' ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600 leading-relaxed">
                If an account exists for that email, you will receive instructions shortly. Open the email on this device
                and tap the link to choose a new password.
              </p>
              {forgotSentDevLink && import.meta.env.DEV ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                    Dev only (SMTP not configured)
                  </p>
                  <a
                    href={forgotSentDevLink}
                    className="break-all text-xs font-mono text-blue-700 underline"
                  >
                    {forgotSentDevLink}
                  </a>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setStudentLoginView('login');
                  setForgotEmail('');
                  setForgotSentDevLink('');
                }}
                className="text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                ← Back to student login
              </button>
            </div>
          ) : role === 'student' && studentLoginView === 'forgot' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                  Registered email
                </label>
                <div className="relative group/input">
                  <input
                    type="email"
                    name="forgotEmail"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 outline-none transition-all focus:bg-white focus:border-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 px-1">
                  Password reset uses <span className="font-semibold text-gray-600">email verification only</span> (not
                  mobile).
                </p>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className={`w-full bg-gradient-to-r ${config.gradient} text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all duration-300 disabled:opacity-70 text-sm tracking-wide`}
              >
                {forgotLoading ? 'Sending…' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudentLoginView('login');
                  setForgotEmail('');
                }}
                className="w-full text-sm font-bold text-gray-500 hover:text-gray-800"
              >
                ← Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                  {role === 'student' ? 'Email or mobile' : role === 'college' ? 'Institution code' : 'User ID'}
                </label>
                <div className="relative group/input">
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder={
                      role === 'student'
                        ? 'Email or 10-digit mobile'
                        : role === 'college'
                          ? 'Enter institution code'
                          : 'Enter user ID'
                    }
                    autoComplete="username"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 outline-none transition-all focus:bg-white focus:border-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    {role === 'student' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Password</label>
                  {role === 'student' ? (
                    <button
                      type="button"
                      onClick={() => setStudentLoginView('forgot')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <div className="relative group/input">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 outline-none transition-all focus:bg-white focus:border-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r ${config.gradient} text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all duration-300 disabled:opacity-70 text-sm tracking-wide`}
              >
                {isLoading ? 'Verifying...' : 'Login to Account'}
              </button>
            </form>
          )}

          {role === 'student' && studentLoginView === 'login' && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-400">
                New applicant?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/student-register')}
                  className="text-gray-600 hover:text-gray-900 font-bold uppercase tracking-wide"
                >
                  Register
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;