import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${
      scrolled 
        ? 'py-3 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)]' 
        : 'py-5 bg-white border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group cursor-pointer transition-all active:scale-95">
          <img
            src="/src/assets/govt_logo.png"
            alt="TN Emblem"
            className={`transition-all duration-500 ${scrolled ? 'h-10' : 'h-12'} w-auto group-hover:scale-105`}
          />
          <span className={`font-bold transition-all duration-500 text-slate-900 tracking-tight leading-none ${
            scrolled ? 'text-base md:text-lg' : 'text-lg md:text-xl'
          }`}>
            Directorate of Technical Education
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
            className={`bg-blue-600 text-white text-[12px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg ${
              scrolled 
                ? 'px-5 py-2 shadow-blue-500/20 hover:bg-blue-700' 
                : 'px-6 py-2.5 shadow-blue-100 hover:bg-blue-700'
            }`}
          >
           Online Application
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
