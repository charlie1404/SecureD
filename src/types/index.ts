export interface Account {
  id: string;
  name: string;
  issuer?: string;
  seed: string;
  secureNotes?: string[];
}

export interface AccountWithTOTP extends Account {
  totp: string;
}

export type Screen = 'onboarding' | 'home' | 'add' | 'settings' | 'notes' | 'qr';
