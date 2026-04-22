import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActionCard = ({ icon, title, description, colorClass, to }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => to && navigate(to)}
      className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <img src={icon} alt={title} className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-2">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const QuickActions = () => {
  const actions = [
    {
      title: "New Registration",
      description: "Create an account to begin your admission process.",
      icon: "/uploads/home/icons/register.png",
      colorClass: "bg-blue-50 text-blue-600",
      to: "/student-register"
    },
    {
      title: "Student Login",
      description: "Access your dashboard to complete your application.",
      icon: "/uploads/home/icons/login.png",
      colorClass: "bg-indigo-50 text-indigo-600",
      to: "/login"
    },
    {
      title: "Track Application",
      description: "Check the realtime status of your submitted application.",
      icon: "/uploads/home/icons/track.png",
      colorClass: "bg-emerald-50 text-emerald-600",
      to: "/login"
    },
    {
      title: "Hall Ticket",
      description: "Download your entrance exam and verification hall tickets.",
      icon: "/uploads/home/icons/hallticket.png",
      colorClass: "bg-orange-50 text-orange-600",
      to: "/login"
    },
    {
      title: "Online Counseling",
      description: "Participate in college selection and seat allotment.",
      icon: "/uploads/home/icons/counseling.png",
      colorClass: "bg-purple-50 text-purple-600",
      to: "/login"
    },
    {
      title: "Help Desk",
      description: "Get support for any queries regarding admissions.",
      icon: "/uploads/home/icons/help.png",
      colorClass: "bg-rose-50 text-rose-600",
      to: "#"
    }
  ];

  return (
    <section className="py-20 bg-slate-50/50 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Quick Links</h2>
          <p className="text-slate-500 max-w-2xl font-medium">Access essential services and complete your admission process efficiently.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <QuickActionCard key={index} {...action} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;
