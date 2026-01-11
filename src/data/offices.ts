export const defaultOffices = [
  "Executive Director of Tecknallogy, TEC",
  "Executive Director of Communications",
  "Executive Director of Operations",
  "Executive Director of Finance",
  "Executive Director of Human Resources",
  "Chief Executive Director",
  "Deputy Executive Director",
  "Regional Coordinator",
  "Project Manager",
  "Senior Advisor",
];

export const getStoredOffices = (): string[] => {
  const stored = localStorage.getItem('dit_offices');
  if (stored) {
    return JSON.parse(stored);
  }
  return defaultOffices;
};

export const saveOffice = (office: string) => {
  const offices = getStoredOffices();
  if (!offices.includes(office)) {
    offices.unshift(office);
    localStorage.setItem('dit_offices', JSON.stringify(offices));
  }
};
