import React from 'react';
import AnimatedCounter from './AnimatedCounter';

const StatCard = ({ title, value, icon, isPercentage = false, valueSuffix = '', theme = 'primary' }) => {
  // Theme variants for the modern manufacturing aesthetic
  const themeStyles = {
    primary: {
      bg: 'bg-white/80',
      iconBg: 'bg-primary-container',
      iconColor: 'text-primary',
      valueColor: 'text-primary'
    },
    success: {
      bg: 'bg-white/80',
      iconBg: 'bg-[#dcfce7]', // green-100
      iconColor: 'text-[#16a34a]', // green-600
      valueColor: 'text-[#16a34a]'
    },
    error: {
      bg: 'bg-error-container/30',
      iconBg: 'bg-error-container',
      iconColor: 'text-error',
      valueColor: 'text-error'
    },
    neutral: {
      bg: 'bg-white/80',
      iconBg: 'bg-surface-variant',
      iconColor: 'text-on-surface-variant',
      valueColor: 'text-on-surface'
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles.primary;

  return (
    <div className={`${currentTheme.bg} backdrop-blur-md rounded-2xl border border-primary/10 shadow-sm p-4 hover:shadow-md transition-shadow duration-300 flex items-center gap-4`}>
      <div className={`${currentTheme.iconBg} ${currentTheme.iconColor} w-12 h-12 rounded-full flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <div>
        <p className="text-label-caps text-on-surface-variant mb-1 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-1 flex-wrap">
          <p className={`text-2xl md:text-3xl lg:text-headline-md font-bold ${currentTheme.valueColor} break-all`}>
            <AnimatedCounter value={value} isPercentage={isPercentage} />
          </p>
          {valueSuffix && (
            <span className="text-sm md:text-body-md text-on-surface-variant">{valueSuffix}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
