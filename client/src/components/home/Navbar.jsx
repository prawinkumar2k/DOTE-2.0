import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-slate-100 py-4 px-4 md:px-8 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group cursor-pointer transition-all active:scale-95">
          <img
            src="/src/assets/govt_logo.png"
            alt="TN Emblem"
            className="h-12 w-auto transition-transform group-hover:scale-105"
          />
          <span className="font-bold text-lg md:text-xl text-slate-900 tracking-tight leading-none">
            Government of Tamil Nadu
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-[13px] font-bold text-slate-600 hover:text-blue-700 transition-colors uppercase tracking-widest px-4 py-2"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/student-register')}
            className="bg-blue-600 text-white text-[12px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
           Online Application
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
