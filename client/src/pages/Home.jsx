import React from 'react';
import Navbar from '../components/home/Navbar';
import HeroSection from '../components/home/HeroSection';
import HowItWorks from '../components/home/HowItWorks';

const Home = () => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main className="pt-20">
        <HeroSection />
        <HowItWorks />
      </main>
    </div>
  );
};

export default Home;