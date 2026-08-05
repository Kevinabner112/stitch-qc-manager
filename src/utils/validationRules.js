export const validateInspection = (inspected, passed, rejected, defectCategory) => {
  const qInspected = Number(inspected) || 0;
  const qPassed = Number(passed) || 0;
  const qRejected = Number(rejected) || 0;

  const isMathValid = (qPassed + qRejected) === qInspected;
  
  let defectValid = true;
  if (qRejected > 0 && !defectCategory) {
    defectValid = false;
  }

  return {
    isValid: isMathValid && defectValid && qInspected > 0,
    isMathValid,
    defectValid,
    qInspected,
    qPassed,
    qRejected
  };
};
