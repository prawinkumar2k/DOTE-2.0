import React, { useState } from 'react';

const StatusSearchCard = () => {
  const [formData, setFormData] = useState({
    regNum: '',
    dob: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Tracking status for: ${formData.regNum}. This is a demonstration UI.`);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
      <h3 className="text-xl font-bold text-slate-900 mb-2">Track Application Status</h3>
      <p className="text-slate-500 text-sm mb-6">Enter your details below to check your current application progress.</p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Registration Number</label>
          <input 
            type="text" 
            placeholder="e.g. 2026123456"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            value={formData.regNum}
            onChange={(e) => setFormData({...formData, regNum: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Date of Birth</label>
          <input 
            type="date" 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            value={formData.dob}
            onChange={(e) => setFormData({...formData, dob: e.target.value})}
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Track My Status
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <span>Secured Portal</span>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <span>256-bit Encryption</span>
      </div>
    </div>
  );
};

export default StatusSearchCard;
