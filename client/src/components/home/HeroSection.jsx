import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from './ImageSlider';

const HeroSection = () => {
  const navigate = useNavigate();

  const highlights = [
    // { label: "Application Deadline", value: "May 15, 2026" },
    { label: "Courses", value: "Diploma Programs" },
    { label: "Mode", value: "Online Registration" },
    { label: "Eligibility", value: "First Year : SSLC / Equivalent",value_2:"Lateral Entry : 12th Pass / 10th Pass + 2 Year ITI",value_3:"Part Time : 10th Pass / 12th Pass / ITI" },

  ];

  return (
    <section className="relative overflow-hidden bg-[#1E40AF] py-10 md:py-14 px-4">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-1/3 h-full bg-blue-400 blur-[100px]"></div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10 text-center md:text-left">

        {/* Left Content */}
        <div className="text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-4 mx-auto md:mx-0">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Admissions for Government & Government Aided Polytechnics 2026-27 LIVE
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-3 text-white !text-white tracking-tight">
            Directorate of Technical Education
          </h1>

          <p className="text-sm md:text-base text-gray-200 font-medium mb-6 max-w-md mx-auto md:mx-0 opacity-90">
            Official admission portal for Government and Government Aided Polytechnics for the Academic Year 2026–2027.
          </p>

          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start mb-4">
            <button
              onClick={() => navigate("/student-register")}
              className="bg-[#FF6D00] hover:bg-[#E65C00] text-white font-bold px-5 py-2.5 rounded-lg transition-all shadow-md text-sm active:scale-95"
            >
              Apply Now
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold px-5 py-2.5 rounded-lg border border-white/20 transition-all text-sm active:scale-95"
            >
              Student Login
            </button>
          </div>
        </div>

        {/* Right Card with Slider */}
        <div className="flex justify-center md:justify-end">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-sm w-full">
            
            <ImageSlider />

            <div className="p-4 md:p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-50 pb-2">Admission Highlights</h3>

              <div className="space-y-3">
                {highlights.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-xs leading-none">
                        {item.label}
                      </span>
                      {item.value && <span className="font-medium text-slate-500 text-[11px] mt-0.5">{item.value}</span>}
                      {item.value_2 && <span className="font-medium text-slate-500 text-[11px] mt-0.5">{item.value_2}</span>}
                      {item.value_3 && <span className="font-medium text-slate-500 text-[11px] mt-0.5">{item.value_3}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* <button
                onClick={() => navigate("/admission-details")}
                className="w-full mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 rounded-lg transition-all text-sm active:scale-95"
              >
                View Full Details
              </button> */}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
