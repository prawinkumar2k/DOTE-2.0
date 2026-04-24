import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import loginBg from '../../assets/login_bg.png';
import govtLogo from '../../assets/govt_logo.png';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-500' : 'bg-emerald-500';
  const shadowColor = isError ? 'shadow-red-200' : 'shadow-emerald-200';
  const progressColor = isError ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div className="fixed top-6 right-6 z-100 flex flex-col pointer-events-auto">
      <div className="bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-xl p-4 flex items-center gap-4 min-w-85 relative overflow-hidden animate-in slide-in-from-right-full fade-in duration-500">
        <div className={`shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white shadow-lg ${shadowColor}`}>
          {isError ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
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
        <div className={`absolute bottom-0 left-0 h-1.5 ${progressColor} w-full animate-progress-shrink origin-left`}></div>
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
  const [studentLoginView, setStudentLoginView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSentDevLink, setForgotSentDevLink] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const roleConfigs = {
    admin: {
      title: 'Admin Login',
      accentColor: 'indigo',
      gradient: 'from-indigo-600 to-indigo-800',
      tabActive: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      target: '/admin/dashboard'
    },
    college: {
      title: 'College Login',
      accentColor: 'blue',
      gradient: 'from-blue-600 to-blue-800',
      tabActive: 'bg-blue-50 text-blue-700 border-blue-200',
      target: '/college/dashboard'
    },
    student: {
      title: 'Student Login',
      accentColor: 'blue',
      gradient: 'from-blue-600 to-indigo-700',
      tabActive: 'bg-blue-50 text-blue-700 border-blue-200',
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
        setToast({ message: `Welcome, ${response.data.user.name}! Redirecting...`, type: 'success' });
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
        setToast({ message: res.data.message, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error occurred', type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-inter">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Left Side: Professional Image Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img 
          src={loginBg} 
          alt="Government Education Portal" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <img src={govtLogo} alt="Govt Logo" className="h-12 w-auto" />
            </div>
            <div className="text-white">
              <p className="text-2xl font-bold uppercase">DOTE - Admission Portal</p>
              <p className="text-xl font-bold text-blue-300 tracking-[0.2em] uppercase">Government of Tamil Nadu</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">
              Tamil Nadu <br />
              <span className="text-blue-400">Polytechnic Admissions</span>
            </p>
            <p className="text-xl text-slate-300 max-w-md font-semibold leading-relaxed">
              Official single-window portal for merit-based admissions to Government and Government-Aided Polytechnic Colleges across the state.
            </p>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-black text-white">400+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Colleges</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-black text-white">50K+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Applications</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400 font-medium italic">
            © 2026 Directorate of Technical Education. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 relative">
        {/* Back to Home Button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-8 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all active:scale-95 text-xs uppercase tracking-wider shadow-sm border border-slate-200/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001-1m-6 0h6" />
          </svg>
          Home
        </button>

        <div className="absolute top-8 left-8 lg:hidden">
           <img src={govtLogo} alt="Govt Logo" className="h-10 w-auto" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {role === 'student' && studentLoginView === 'forgot'
                ? 'Reset Password'
                : role === 'student' && studentLoginView === 'forgotSent'
                  ? 'Check Email'
                  : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {role === 'student' && studentLoginView === 'forgot'
                ? 'Enter your email to receive a reset link.'
                : role === 'student' && studentLoginView === 'forgotSent'
                  ? 'Verification link sent to your email.'
                  : 'Please sign in to your official account'}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="p-1 bg-slate-100/80 rounded-xl flex items-center shadow-inner border border-slate-200/50">
            {Object.keys(roleConfigs).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setRole(tab);
                  setFormData({ identifier: '', password: '' });
                  setStudentLoginView('login');
                }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-all duration-300 capitalize ${
                  role === tab ? `bg-white text-${roleConfigs[tab].accentColor}-700 shadow-sm ring-1 ring-black/5` : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {studentLoginView === 'forgotSent' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                 <p className="text-sm text-blue-800 leading-relaxed font-medium">
                   We've sent a recovery link to your registered email address. Please follow the instructions to reset your password.
                 </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentLoginView('login')}
                className="w-full py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={studentLoginView === 'forgot' ? handleForgotSubmit : handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] px-1">
                  {studentLoginView === 'forgot' ? 'Email Address' : (role === 'student' ? 'Email or Mobile' : role === 'college' ? 'Institution Code' : 'User ID')}
                </label>
                <input
                  type={studentLoginView === 'forgot' ? 'email' : 'text'}
                  name={studentLoginView === 'forgot' ? 'forgotEmail' : 'identifier'}
                  value={studentLoginView === 'forgot' ? forgotEmail : formData.identifier}
                  onChange={studentLoginView === 'forgot' ? (e) => setForgotEmail(e.target.value) : handleInputChange}
                  placeholder={studentLoginView === 'forgot' ? 'Enter email' : 'Username'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                />
              </div>

              {studentLoginView !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Password</label>
                    {role === 'student' && (
                      <button
                        type="button"
                        onClick={() => setStudentLoginView('forgot')}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || forgotLoading}
                className={`w-full bg-linear-to-r ${config.gradient} text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 text-sm tracking-wide uppercase`}
              >
                {isLoading || forgotLoading ? 'Processing...' : (studentLoginView === 'forgot' ? 'Send Reset Link' : 'Sign In')}
              </button>
            </form>
          )}

          {role === 'student' && studentLoginView === 'login' && (
            <div className="pt-6 border-t border-slate-100 text-center">
              <p className="text-sm font-bold text-slate-400">
                New to the portal?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/student-register')}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          )}

          {studentLoginView === 'forgot' && (
             <button
              type="button"
              onClick={() => setStudentLoginView('login')}
              className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              ← Return to Login
            </button>
          )}
        </div>
        
        <div className="absolute bottom-8 text-[11px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">
           Official Portal • Directorate of Technical Education
        </div>
      </div>
    </div>
  );
};

export default Login;
