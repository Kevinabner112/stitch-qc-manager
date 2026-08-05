export const getGrade = (acceptanceRate) => {
  if (acceptanceRate >= 98) return 'A';
  if (acceptanceRate >= 95) return 'B';
  if (acceptanceRate >= 90) return 'C';
  return 'D';
};

export const getStatusText = (acceptanceRate) => {
  if (acceptanceRate === 100) return 'FULL PASS';
  if (acceptanceRate >= 90) return 'PARTIAL PASS';
  return 'REJECTED';
};
