import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10 px-4 md:px-8 border-t-8 border-blue-700">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
               <img src="/src/assets/govt_logo.png" alt="DOTE" className="h-10 w-auto" />
               <span className="text-white font-bold text-xl leading-tight">DOTE Admissions</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 opacity-70">
              The Directorate of Technical Education is responsible for the development of technical education in the state of Tamil Nadu.
            </p>
            <div className="flex gap-4">
              {['facebook', 'twitter', 'youtube', 'linkedin'].map((social) => (
                <div key={social} className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  {/* Icons could be here */}
                  <span className="capitalize text-[10px]">{social[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Admission Guidelines</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Participating Colleges</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Seat Matrix</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Counseling Schedule</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Desk</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Disclaimer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Helpline</p>
                  <p className="text-white font-bold">1800-425-0110</p>
                  <p className="text-xs opacity-60">(10:00 AM - 6:00 PM)</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Address</p>
                  <p className="text-white font-bold leading-relaxed">
                    Directorate of Technical Education (DOTE),<br/>
                    53, Sardar Patel Rd, Guindy,<br/>
                    Chennai, Tamil Nadu 600025
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm opacity-50 font-medium">
            &copy; 2026 Directorate of Technical Education, Government of Tamil Nadu. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold opacity-30 tracking-widest uppercase">Privacy First Portal</span>
            <div className="h-4 w-px bg-slate-800"></div>
            <span className="text-xs font-bold opacity-30 tracking-widest uppercase">Designed with High Fidelity</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
