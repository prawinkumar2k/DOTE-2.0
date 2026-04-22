import React, { useState, useEffect } from 'react';

const CountUp = ({ end, duration = 2, suffix = "", decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
};

const StatCard = ({ number, label, suffix = "+", decimals = 0 }) => {
  const numValue = parseFloat(number);
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-sm min-w-[120px] text-center">
        <CountUp end={numValue} suffix={suffix} decimals={decimals} />
      </div>
      <div className="text-blue-100 font-bold uppercase tracking-widest text-[10px] md:text-xs text-center opacity-80">
        {label}
      </div>
    </div>
  );
};

const Stats = () => {
  return (
    <section className="py-20 bg-blue-700 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <StatCard number="450" label="Participating Colleges" />
          <StatCard number="1.5" suffix="L" label="Total Seats Available" decimals={1} />
          <StatCard number="62" suffix="" label="Diverse B.E/B.Tech Courses" />
          <StatCard number="2.1" suffix="L" label="Success Last Year" decimals={1} />
        </div>
      </div>
    </section>
  );
};

export default Stats;
