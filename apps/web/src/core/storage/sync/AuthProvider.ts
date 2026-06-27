// v3 seam (interface only): authentication for cloud sync. Tools never see this;
// only CloudPaletteStore depends on it. Sign-in UI lands as a `features/account` module.

export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

export interface AuthProvider {
  currentUser(): User | null;
  getToken(): Promise<string | null>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}
