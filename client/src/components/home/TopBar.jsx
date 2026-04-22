import React from 'react';

const TopBar = () => {
  return (
    <div className="bg-slate-100 border-b border-slate-200 py-2 px-4 md:px-8 text-xs font-medium text-slate-600">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/server/uploads/photos/govt_logo.png"
            alt="TN Emblem"
            className="h-10 w-auto"
          />
          <span className="font-bold text-lg md:text-xl text-gray-800 tracking-wide">Government of Tamil Nadu</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border-r border-slate-300 pr-6">
            <button className="hover:text-blue-700 transition-colors uppercase">English</button>
            <span className="text-slate-300 text-[10px]">|</span>
            <button className="hover:text-blue-700 transition-colors font-tamil">தமிழ்</button>
          </div>
          <div className="flex items-center gap-3">
            <button className="hover:text-blue-700 transition-colors px-1" title="Decrease Font">A-</button>
            <button className="hover:text-blue-700 transition-colors px-1 bg-white border border-slate-300 rounded shadow-sm" title="Standard Font">A</button>
            <button className="hover:text-blue-700 transition-colors px-1" title="Increase Font">A+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
