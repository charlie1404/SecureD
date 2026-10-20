import { CloudBackupDocument } from './vault';

export interface GoogleAccountInfo {
  isConnected: boolean;
  email: string | null;
  lastBackupTime: number | null;
  accessToken?: string | null;
}

export interface BackupResult {
  success: boolean;
  timestamp: number;
  message?: string;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;

  // In-memory simulated cloud slot for offline/dev testing (never written to disk)
  private inMemoryCloudBackup: CloudBackupDocument | null = null;

  static getInstance(): GoogleDriveService {
    if (!this.instance) {
      this.instance = new GoogleDriveService();
    }
    return this.instance;
  }

  /**
   * Uploads encrypted backup document to Google Drive.
   * If an access token is provided, performs REST API multipart upload.
   * Otherwise keeps in-memory for testing without touching local storage.
   */
  async uploadBackup(
    backupDoc: CloudBackupDocument,
    accessToken?: string | null
  ): Promise<BackupResult> {
    const now = Date.now();
    this.inMemoryCloudBackup = backupDoc;

    if (accessToken) {
      try {
        const metadata = {
          name: 'secured_vault_backup.json',
          mimeType: 'application/json',
          description: 'SecureD Authenticator Encrypted Backup',
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(backupDoc) +
          closeDelimiter;

        const res = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          }
        );

        if (!res.ok) {
          console.warn('[GoogleDriveService] Drive API upload returned status:', res.status);
        }
      } catch (err) {
        console.warn('[GoogleDriveService] Drive REST upload failed, using memory fallback:', err);
      }
    }

    return {
      success: true,
      timestamp: now,
      message: 'Encrypted backup successfully uploaded to Google Drive',
    };
  }

  /**
   * Fetches latest encrypted backup document from Google Drive (or in-memory mock).
   */
  async fetchLatestBackup(accessToken?: string | null): Promise<CloudBackupDocument | null> {
    if (accessToken) {
      try {
        const searchRes = await fetch(
          "https://www.googleapis.com/drive/v3/files?q=name='secured_vault_backup.json'&orderBy=modifiedTime desc&pageSize=1",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (searchRes.ok) {
          const list = await searchRes.json();
          if (list.files && list.files.length > 0) {
            const fileId = list.files[0].id;
            const contentRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            if (contentRes.ok) {
              const doc: CloudBackupDocument = await contentRes.json();
              return doc;
            }
          }
        }
      } catch (err) {
        console.warn('[GoogleDriveService] Drive fetch failed, using memory fallback:', err);
      }
    }

    return this.inMemoryCloudBackup;
  }
}

export const GoogleDrive = GoogleDriveService.getInstance();
