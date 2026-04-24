import React from 'react';

const HowItWorks = () => {
  const steps = [
    { 
      title: "Registration", 
      desc: "Initial step to create your profile on the portal.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    { 
      title: "Data Entry", 
      desc: "Complete your academic and personal information.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    { 
      title: "Verification", 
      desc: "Upload official documents for authentication.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    { 
      title: "Fee Payment", 
      desc: "Secure online processing of admission fees.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      title: "Final Review", 
      desc: "Comprehensive review and official submission.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-32 bg-slate-50 px-6 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-4">The Process</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">Five Steps to Success</h3>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Follow our standardized procedure to ensure your application is processed efficiently and accurately.
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="relative mb-8 w-full flex justify-center">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-slate-200" />
                )}
                
                {/* Icon Container */}
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm transition-all duration-500 group-hover:border-blue-500 group-hover:text-blue-600 group-hover:shadow-xl group-hover:shadow-blue-500/10">
                   {step.icon}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                   {step.title}
                </h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                   {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
