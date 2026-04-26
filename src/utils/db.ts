import { open } from '@op-engineering/op-sqlite';
import { Account } from '../types';

const db = open({ name: 'secured.sqlite' });

export const initDB = () => {
  try {
    db.executeSync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        issuer TEXT,
        seed TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error('Failed to init DB:', error);
  }
};

export const getAccounts = (): Account[] => {
  try {
    const result = db.executeSync('SELECT * FROM accounts;');
    // op-sqlite usually exposes rows as an array, or rows._array
    if (result.rows && Array.isArray(result.rows)) {
      return result.rows as unknown as Account[];
    } else if (result.rows && '_array' in result.rows) {
      return (result.rows as any)._array as Account[];
    }
    return [];
  } catch (error) {
    console.error('Failed to get accounts:', error);
    return [];
  }
};

export const addAccountToDB = (account: Account) => {
  try {
    db.executeSync(
      'INSERT INTO accounts (id, name, issuer, seed) VALUES (?, ?, ?, ?);',
      [account.id, account.name, account.issuer || null, account.seed]
    );
  } catch (error) {
    console.error('Failed to add account:', error);
  }
};

export const removeAccountFromDB = (id: string) => {
  try {
    db.executeSync('DELETE FROM accounts WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Failed to remove account:', error);
  }
};
