import React from 'react';

const HowItWorks = () => {
  const steps = [
    { 
      title: "Register", 
      desc: "Create an account with your basic details and email.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    { 
      title: "Fill Form", 
      desc: "Complete your academic and personal profile details.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    { 
      title: "Upload", 
      desc: "Scan and upload required documents for verification.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    { 
      title: "Pay", 
      desc: "Process admission fees through secure online payment.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      title: "Submit", 
      desc: "Final review and submission of your application.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-24 bg-white px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Five Steps to Apply</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium text-sm md:text-base leading-relaxed opacity-80">Follow this simple procedure to complete your application for the 2026-27 session.</p>
        </div>

        <div className="flex flex-wrap justify-center lg:flex-nowrap lg:justify-between gap-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1 min-w-[180px] text-center group cursor-default">
              <div className="relative mb-8 z-10 w-full flex justify-center">
                {/* Icon Container with Smooth Hover */}
                <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-white shadow-[0_15px_30px_-5px_rgba(37,99,235,0.2)] transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-700 group-hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.4)]">
                   <div className="transition-transform duration-500 group-hover:scale-110">
                     {step.icon}
                   </div>
                </div>
                
                {/* Dashboard Connector Line - Desktop and Wide Screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[48px] left-[calc(50%+60px)] w-[calc(100%-120px)] h-0.5 border-t-2 border-dashed border-slate-200 -z-10 group-hover:border-blue-200 transition-colors duration-500"></div>
                )}
              </div>

              <h4 className="text-lg font-black text-slate-900 mb-2 transition-colors duration-300 group-hover:text-blue-700">{step.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed transition-all duration-300 group-hover:text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
