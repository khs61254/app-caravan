export type UserRole = 'host' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Should not be sent to client
  photoUrl: string;
  contact: string;
  role: UserRole;
  // In a real system, this would be more complex
  // and likely involve a separate identity verification entity.
  isVerified: boolean;
}
