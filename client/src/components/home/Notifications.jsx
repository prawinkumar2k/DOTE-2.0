import React from 'react';

const Notifications = () => {
  const announcements = [
    { 
      title: "Consolidated Guidelines for Admission into Engineering Colleges 2026-27", 
      date: "April 18, 2026", 
      category: "Guideline",
      link: "/uploads/home/guidelines-2026.pdf"
    },
    { 
      title: "List of Mandatory Documents for Online Certificate Verification", 
      date: "April 15, 2026", 
      category: "Document",
      link: "/uploads/home/mandatory-documents.pdf"
    },
    { 
      title: "Notification for Lateral Entry Admission (Second Year B.E/B.Tech)", 
      date: "April 10, 2026", 
      category: "Notification",
      link: "/uploads/home/lateral-entry.pdf"
    },
    { 
      title: "Fee Waiver Scheme for First Generation Graduates - Rules & Eligibility", 
      date: "April 05, 2026", 
      category: "Clarification",
      link: "/uploads/home/fee-waiver.pdf"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Latest Notifications</h2>
            <p className="text-slate-500 max-w-xl font-medium">Stay updated with the latest news, circulars, and announcements regarding the admission process.</p>
          </div>
          <button className="text-blue-700 font-bold flex items-center gap-2 hover:gap-3 transition-all">
            View All Archive
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {announcements.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg hover:border-blue-100 transition-all group">
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center font-bold">
                   <span className="text-[10px] uppercase opacity-70 leading-none mb-0.5">Apr</span>
                   <span className="text-lg leading-none">{18 - (index * 2)}</span>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold py-0.5 uppercase tracking-wider">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors text-lg leading-snug">{item.title}</h4>
                </div>
              </div>
              <a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all group/btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Notifications;
