import React from 'react';
import Navbar from '../components/home/Navbar';
import AnnouncementTicker from '../components/home/AnnouncementTicker';
import HeroSection from '../components/home/HeroSection';
// import QuickActions from '../components/home/QuickActions';
// import Timeline from '../components/home/Timeline';
import HowItWorks from '../components/home/HowItWorks';
import Stats from '../components/home/Stats';
// import Notifications from '../components/home/Notifications';
import FAQ from '../components/home/FAQ';
import Eligibility from '../components/home/Eligibility';
import Footer from '../components/home/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      {/* <AnnouncementTicker /> */}
      <main>
        <HeroSection />
        {/* <QuickActions /> */}
        {/* <Timeline /> */}
        <HowItWorks />
        {/* <Stats />
        <Eligibility /> */}
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default Home;