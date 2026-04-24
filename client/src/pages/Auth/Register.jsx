import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const ADMISSION_OPTIONS = [
  { value: 'first_year', label: 'First Year' },
  { value: 'lateral_entry', label: 'Lateral Entry' },
  { value: 'part_time', label: 'Part Time' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    admissionType: 'first_year',
    password: '',
    confirmPassword: ''
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.password) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    const email = formData.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ message: 'Please enter a valid email address', type: 'error' });
      return;
    }
    if (formData.mobile.length !== 10) {
      setToast({ message: 'Enter a valid 10-digit mobile number', type: 'error' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: "Passwords do not match", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.fullName,
        email,
        mobile: formData.mobile,
        admissionType: formData.admissionType,
        password: formData.password,
        role: 'student'
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setToast({ message: "Account created successfully!", type: 'success' });
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Registration failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-inter">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-slate-900">
        <img src={loginBg} alt="DOTE Bg" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-linear-to-b from-blue-900/40 to-slate-900" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-4">
             <div className="bg-white p-2 rounded-xl">
               <img src={govtLogo} alt="Logo" className="h-10 w-auto" />
             </div>
             <div className="text-white">
                <p className="text-2xl font-black tracking-tight uppercase">DOTE - Admission Portal</p>
                <p className="text-lg font-bold text-blue-300 tracking-widest uppercase">Government of Tamil Nadu</p>
             </div>
          </div>

          <div className="space-y-6">
            <p className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">
              Tamil Nadu <br />
              <span className="text-blue-400">Polytechnic Admissions</span>
            </p>
            <p className="text-lg text-slate-300 font-semibold leading-relaxed">
              Start your journey today by registering on the official single-window portal for Government and Aided Polytechnic College admissions.
            </p>
          </div>

          <p className="text-sm text-slate-400 font-medium italic">
            © 2026 Directorate of Technical Education. All rights reserved.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative">
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

        <div className="w-full max-lg space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-slate-500 font-medium mt-2">Enter your details to begin the registration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
              <input type="tel" name="mobile" maxLength={10} value={formData.mobile} onChange={handleInputChange} placeholder="9876543210" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all" />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Admission Category</label>
              <div className="grid grid-cols-3 gap-3">
                {ADMISSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(p => ({...p, admissionType: opt.value}))}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                      formData.admissionType === opt.value ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-linear-to-r from-blue-600 to-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 text-xs uppercase tracking-[0.1em]">
              {isLoading ? 'Creating Account...' : 'Initialize Registration'}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
             <p className="text-sm font-bold text-slate-400">
               Already registered? <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-800 transition-colors">Sign In Here</button>
             </p>
          </div>

          <div className="text-center mt-6">
             <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">
              Official Portal • Directorate of Technical Education
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
