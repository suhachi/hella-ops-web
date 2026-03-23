export type UserRole = 'ADMIN' | 'SUPER_ADMIN' | 'LEADER' | 'WORKER';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  isActive: boolean;
  phoneNumber?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
