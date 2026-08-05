import React from 'react';

const ValidationBanner = ({ validation }) => {
  if (!validation) return null;

  const { isMathValid, qInspected, qPassed, qRejected } = validation;

  if (isMathValid && qInspected > 0) {
    return (
      <div className="mt-md bg-[#f0fdf4] border border-[#bbf7d0] rounded-md p-sm flex items-center gap-sm">
        <span className="material-symbols-outlined text-[#16a34a]">check_circle</span>
        <p className="text-body-md text-[#15803d] font-medium">
          Formula Check: {qPassed} Passed + {qRejected} Rejected = {qInspected} Inspected [VALID ✓]
        </p>
      </div>
    );
  } else if (qInspected > 0) {
    return (
      <div className="mt-md bg-error-container border border-error/30 rounded-md p-sm flex items-center gap-sm">
        <span className="material-symbols-outlined text-error">error</span>
        <p className="text-body-md text-on-error-container font-medium">
          Error: {qPassed} Passed + {qRejected} Rejected != {qInspected} Inspected
        </p>
      </div>
    );
  }

  return null;
};

export default ValidationBanner;
