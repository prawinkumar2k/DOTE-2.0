import React, { useState } from 'react';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`border-b border-slate-100 last:border-0 ${isOpen ? 'bg-blue-50/30' : ''} transition-colors`}>
      <button 
        className="w-full py-4 flex items-center justify-between text-left group"
        onClick={onClick}
      >
        <span className={`text-base font-bold ${isOpen ? 'text-blue-700' : 'text-slate-800'} group-hover:text-blue-600 transition-colors leading-tight pr-4`}>
          {question}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 shrink-0 transform transition-transform ${isOpen ? 'rotate-180 text-blue-700' : 'text-slate-400'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-6 text-slate-600 text-[13px] leading-relaxed font-medium">
          {answer}
        </div>
      )}
    </div>
  );
};

const Eligibility = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const criteria = [
    { title: "Photograph", detail: "Recent passport size photograph of the candidate." },
    { title: "Marksheet", detail: "10th / 12th mark sheets (or equivalent certificates)." },
    { title: "Transfer Certificate (TC)", detail: "TC from the last studied institution." },
    { title: "Community Certificate", detail: "Applicable for reserved category candidates." }
  ];

  const faqs = [
    {
      question: "How do I register for the 2026 admissions?",
      answer: "Click on the 'Apply Now' or 'Register' button on the home page. Fill in your basic details like Name, Email, and Mobile Number. You will receive a verification OTP."
    },
    {
      question: "What documents are required for online verification?",
      answer: "You will need scanned copies of: 10th & 12th Mark sheets, TC, Community Certificate, Nativity Certificate (if applicable), and Passport size photograph."
    },
    {
      question: "Can I edit my application after submission?",
      answer: "No, once final submit is clicked, you cannot edit. However, during verification, corrections might be allowed if discrepancies are found."
    },
    {
      question: "What is the process for First Graduate fee waiver?",
      answer: "To claim this, you must produce the 'First Graduate Certificate'. If a sibling has already availed this benefit, you are not eligible."
    }
  ];

  return (
    <section className="py-20 bg-slate-50 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Side: FAQ */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-slate-500 font-medium">Quick answers to common queries.</p>
            </div>
            
            <div className="overflow-hidden">
              {faqs.map((faq, index) => (
                <FAQItem 
                  key={index} 
                  question={faq.question} 
                  answer={faq.answer} 
                  isOpen={openIndex === index}
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                />
              ))}
            </div>
          </div>

          {/* Right Side: Requirements */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                Requirements
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">Eligibility Criteria</h2>
            </div>
            
            <div className="space-y-6">
              {criteria.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-0.5 text-sm">{item.title}</h4>
                    <p className="text-slate-500 text-[12px] leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Eligibility;
