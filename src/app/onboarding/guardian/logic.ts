import { updateGuardianStatus } from "./firebase";

export const handleGuardianSubmit = async (parentEmail: string) => {
  // 1. Basic Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(parentEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  // 2. Update Firebase
  // In the future, this is where you'd trigger your email service (like Resend or NodeMailer)
  return await updateGuardianStatus(parentEmail);
};