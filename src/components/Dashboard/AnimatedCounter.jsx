import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value, duration = 1000, isPercentage = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = Number(value) || 0;
    
    if (endValue === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo for smooth deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * endValue));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };
    
    window.requestAnimationFrame(step);
    
    return () => {
      startTimestamp = null;
    };
  }, [value, duration]);

  const displayValue = count.toLocaleString('id-ID');
  
  return (
    <span>
      {displayValue}
      {isPercentage ? '%' : ''}
    </span>
  );
};

export default AnimatedCounter;
