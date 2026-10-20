export interface Account {
  id: string;
  name: string;
  issuer?: string;
  seed: string;
  secureNotes?: string[];
  createdAt?: number;
  lastSyncedAt?: number;
  excludeFromSync?: boolean;
}

export interface AccountWithTOTP extends Account {
  totp: string;
}
