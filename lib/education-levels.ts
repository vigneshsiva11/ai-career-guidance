export const EDUCATION_LEVEL_OPTIONS = [
  "6th Standard",
  "7th Standard",
  "8th Standard",
  "9th Standard",
  "10th Standard",
  "11th Standard",
  "12th Standard",
  "Diploma 1st Year",
  "Diploma 2nd Year",
  "Diploma 3rd Year",
  "Bachelors 1st Year",
  "Bachelors 2nd Year",
  "Bachelors 3rd Year",
  "Bachelors 4th Year",
  "Masters 1st Year",
  "Masters 2nd Year",
  "Working Professional (0-2 years)",
  "Working Professional (2-5 years)",
  "Working Professional (5+ years)",
] as const;

export type EducationLevel = (typeof EDUCATION_LEVEL_OPTIONS)[number];

export function isProfessionalEducationLevel(level: string) {
  return level.toLowerCase().includes("working professional");
}
