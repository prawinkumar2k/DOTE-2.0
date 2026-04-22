import React from 'react';

const AnnouncementTicker = () => {
  const messages = [
    "Admission for B.E/B.Tech/B.Arch 2026-27 is now open.",
    "Last date for online registration has been extended to May 15, 2026.",
    "Check the latest rank list and counseling schedule in the notification section.",
    "Candidates are requested to upload original scanned documents for verification."
  ];

  return (
    <div className="bg-orange-50 border-y border-orange-100 overflow-hidden py-2 relative flex items-center">
      <div className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 ml-4 rounded z-10 whitespace-nowrap shadow-sm uppercase tracking-wider">
        Updates
      </div>
      <div className="ticker-wrapper flex whitespace-nowrap group">
        <div className="flex animate-scroll hover:pause-scroll">
          {messages.map((msg, index) => (
            <div key={index} className="flex items-center mx-12">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-3"></span>
              <p className="text-sm font-medium text-slate-800">{msg}</p>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((msg, index) => (
            <div key={`dup-${index}`} className="flex items-center mx-12">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-3"></span>
              <p className="text-sm font-medium text-slate-800">{msg}</p>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .hover\\:pause-scroll:hover {
          animation-play-state: paused;
        }
      ` }} />
    </div>
  );
};

export default AnnouncementTicker;
