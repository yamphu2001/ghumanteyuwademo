import { auth } from "@/lib/firebase";
import { saveUserToFirestore } from './firebase';

export const isAdult = (birthDate: Date): boolean => {
  const today = new Date();
  const eighteenthBirthday = new Date(birthDate);
  eighteenthBirthday.setFullYear(birthDate.getFullYear() + 18);
  return today >= eighteenthBirthday;
};

export const getOnboardingRedirect = (birthDate: Date): 'guardian-email' | 'success' => {
  return isAdult(birthDate) ? 'success' : 'guardian-email';
};

/**
 * Prepares the final record and pulls the email directly from Google Auth
 */
export const completeOnboarding = async (username: string, date: Date) => {
  const user = auth.currentUser;
  
  if (!user) throw new Error("Unauthorized access attempt.");

  const record = {
    username: username.trim(),
    email: user.email!, // Grabbing email directly from Google Auth
    dob: date.toISOString(),
    isAdult: isAdult(date),
    points: 100, // Welcome bonus
    currency: 10,
    unlocked_zones: [], // "Fog of war" starting state
    createdAt: new Date().toISOString(),
    ui_preferences: { theme: 'light' } 
  };

  return await saveUserToFirestore(record);
};