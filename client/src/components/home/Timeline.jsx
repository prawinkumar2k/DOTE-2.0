import React from 'react';

const Timeline = () => {
  const steps = [
    { title: "User Registration", date: "April 1 - May 10", status: "Active" },
    { title: "Fill Application", date: "April 5 - May 15", status: "Upcoming" },
    { title: "Document Verification", date: "May 20 - June 5", status: "Upcoming" },
    { title: "Publication of Rank List", date: "June 15", status: "Upcoming" },
    { title: "Online Counseling", date: "June 20 onwards", status: "Upcoming" }
  ];

  return (
    <section className="py-24 bg-white px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Admission Timeline 2026</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">Keep track of important dates and milestones for your admission journey.</p>
        </div>

        <div className="relative">
          {/* Progress Line */}
          <div className="hidden lg:block absolute top-[44px] left-8 right-8 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/5 bg-blue-600"></div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-4 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex lg:flex-col items-center lg:items-start group flex-1">
                <div className="mr-6 lg:mr-0 lg:mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                    index === 0 ? 'bg-blue-600 border-blue-100 text-white shadow-xl shadow-blue-200' : 'bg-white border-slate-50 text-slate-400 group-hover:border-blue-50 transition-colors'
                  }`}>
                    {index === 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-2xl font-bold italic">{index + 1}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                    index === 0 ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    Step {index + 1} • {step.status}
                  </span>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{step.title}</h4>
                  <p className="text-slate-500 font-medium text-sm">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
