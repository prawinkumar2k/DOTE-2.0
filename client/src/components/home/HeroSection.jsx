import React from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../../assets/hero_bg.png';

const HeroSection = () => {
  const navigate = useNavigate();

  const highlights = [
    { label: "Diploma Programs", value: "Merit-based admission to 400+ Government and Aided Polytechnic Colleges." },
    { label: "Admission Mode", value: "Centralized Online Counseling System for transparent seat allocation." },
    { label: "State-wide Reach", value: "Access to technical education across all districts of Tamil Nadu." },
  ];

  return (
    <section className="relative bg-white pt-16 pb-20 overflow-hidden border-b border-slate-100">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 skew-x-[-12deg] translate-x-1/4 -z-0 hidden lg:block" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Content Area */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full shadow-sm">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="text-[11px] font-black text-blue-800 uppercase tracking-[0.15em]">
                Admissions 2026-27 • Live Now
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight uppercase">
                Online <br />
                <span className="text-blue-600">Admission Portal</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
                Official centralized portal for Directorate of Technical Education. 
                Providing transparent and merit-based admission opportunities to future engineers of Tamil Nadu.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate("/student-register")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 text-sm uppercase tracking-widest"
              >
                Start Application
              </button>
              <button
                onClick={() => navigate("/login")}
                className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-8 py-4 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 text-sm uppercase tracking-widest"
              >
                Candidate Login
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
              <div>
                <p className="text-3xl font-black text-slate-900">400+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutions</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">100%</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transparency</p>
              </div>
            </div>
          </div>

          {/* Right: Featured Card */}
          <div className="relative">
            <div className="relative z-10 bg-white rounded-[32px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100">
               <div className="overflow-hidden rounded-[24px] aspect-[4/3]">
                 <img 
                    src={heroBg} 
                    alt="Campus" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                  />
               </div>
               
               <div className="p-8 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <span className="w-8 h-1 bg-blue-600 rounded-full" />
                   Admission Highlights
                 </h3>
                 <div className="space-y-6">
                   {highlights.map((item, index) => (
                     <div key={index} className="flex gap-4 group">
                       <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                         </svg>
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                         <p className="text-slate-500 text-xs mt-1 leading-relaxed font-medium">{item.value}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
            
            {/* Background floating element */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl" />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;

