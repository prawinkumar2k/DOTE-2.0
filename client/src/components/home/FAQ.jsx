import React, { useState } from 'react';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`border-b border-slate-100 last:border-0 ${isOpen ? 'bg-blue-50/30' : ''} transition-colors`}>
      <button 
        className="w-full py-6 flex items-center justify-between text-left group"
        onClick={onClick}
      >
        <span className={`text-lg font-bold ${isOpen ? 'text-blue-700' : 'text-slate-800'} group-hover:text-blue-600 transition-colors`}>
          {question}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 transform transition-transform ${isOpen ? 'rotate-180 text-blue-700' : 'text-slate-400'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-8 text-slate-600 leading-relaxed font-medium">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How do I register for the 2026 admissions?",
      answer: "Click on the 'Apply Now' or 'Register' button on the home page. Fill in your basic details like Name, Email, and Mobile Number. You will receive a verification OTP. Once verified, you can set your password and start the application."
    },
    {
      question: "What documents are required for online verification?",
      answer: "You will need scanned copies of: 10th & 12th Mark sheets, Transfer Certificate, Community Certificate (if applicable), Nativity Certificate (if applicable), and Passport size photograph. Ensure all scans are below 2MB in PDF/JPG format."
    },
    {
      question: "Can I edit my application after submission?",
      answer: "No, once the final submit button is clicked, you cannot edit the details. However, during the certificate verification phase, if the authority finds discrepancies, they might open a specific window for corrections."
    },
    {
      question: "What is the process for First Graduate fee waiver?",
      answer: "To claim the First Graduate fee concession, you must produce the 'First Graduate Certificate' issued by the Competent Revenue Authority. Note that if a sibling has already availed of this benefit, you are not eligible."
    }
  ];

  return (
    <section className="py-24 bg-white px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-500 font-medium">Find quick answers to common queries about the admission portal and process.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden px-8">
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
        
        <div className="mt-12 text-center">
          <p className="text-slate-500 font-medium mb-4">Didn't find what you were looking for?</p>
          <button className="bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95">
            Contact Support Helpdesk
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
