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
  { label: 'First Year', value: 'First Year' },
  { label: 'Lateral Entry', value: 'Lateral Entry' },
  { label: 'Part Time', value: 'Part Time' }
];

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    admissionType: '',
    password: '',
    confirmPassword: ''
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, mobile: digitsOnly }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email?.trim() || !formData.mobile || !formData.admissionType || !formData.password || !formData.confirmPassword) {
      setToast({ message: 'Please fill in all fields, including admission category', type: 'error' });
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
    if (!ADMISSION_OPTIONS.some(opt => opt.value === formData.admissionType)) {
      setToast({ message: 'Please select a valid admission category', type: 'error' });
      return;
    }

    const payload = {
      name: formData.fullName,
      email,
      mobile: formData.mobile,
      admissionType: formData.admissionType,
      password: formData.password,
      role: 'student'
    };
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: "Passwords do not match", type: 'error' });
      return;
    }
    if (formData.password.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        ...payload,
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setToast({ message: "Account created successfully! Redirecting to login...", type: 'success' });
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 py-10 relative overflow-hidden bg-linear-to-br from-indigo-50 via-white to-blue-50">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl shadow-sm text-gray-600 hover:text-black hover:bg-white transition-all group active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001-1m-6 0h6" />
        </svg>
        <span className="text-sm font-bold uppercase tracking-wider">Home</span>
      </button>
      
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px] opacity-10"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] opacity-10"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-lg rounded-2xl p-5">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-1">Create Student Account</h2>
            <p className="text-sm text-gray-500 font-medium">Begin your admission process</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter full name" autoComplete="name" className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-4 text-sm font-medium outline-none focus:border-blue-300 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="name@example.com" autoComplete="email" className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-4 text-sm font-medium outline-none focus:border-blue-300 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Mobile number</label>
              <input type="tel" name="mobile" inputMode="numeric" value={formData.mobile} onChange={handleInputChange} placeholder="10-digit mobile number" maxLength={10} autoComplete="tel" className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-4 text-sm font-medium outline-none focus:border-blue-300 transition-all" />
              <p className="text-[11px] text-slate-400 px-1">Use the same email or mobile when you log in.</p>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Admission category</label>
              <div className="grid grid-cols-3 gap-2">
                {ADMISSION_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all" style={{backgroundColor: formData.admissionType === opt.value ? '#f0f9ff' : 'transparent', borderColor: formData.admissionType === opt.value ? '#3b82f6' : '#e2e8f0'}}>
                    <input
                      type="radio"
                      name="admissionType"
                      value={opt.value}
                      checked={formData.admissionType === opt.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" autoComplete="new-password" className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-4 text-sm font-medium outline-none focus:border-blue-300 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Confirm</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" autoComplete="new-password" className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-4 text-sm font-medium outline-none focus:border-blue-300 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium py-2.5 rounded-lg shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2 text-sm uppercase tracking-wide">
              {isLoading ? 'Creating Account...' : 'Setup Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-50 text-center">
            <p className="text-xs font-semibold text-slate-400">Already have an account? <button onClick={() => navigate('/login')} className="text-blue-600 font-bold uppercase tracking-wide">Login</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
