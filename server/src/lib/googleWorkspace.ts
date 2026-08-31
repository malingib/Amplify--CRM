import { google, drive_v3, gmail_v1, calendar_v3, people_v1 } from 'googleapis';
import { config } from '../config';

let driveClient: drive_v3.Drive | null = null;
let gmailClient: gmail_v1.Gmail | null = null;
let calendarClient: calendar_v3.Calendar | null = null;
let peopleClient: people_v1.People | null = null;

function getAuthClient() {
  const keyFile = config.google.serviceAccountKey;
  if (!keyFile) return null;

  try {
    const credentials = JSON.parse(keyFile);
    return new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/contacts',
      ],
    });
  } catch {
    return null;
  }
}

function ensureClients() {
  if (driveClient && gmailClient && calendarClient && peopleClient) return true;
  const auth = getAuthClient();
  if (!auth) return false;
  driveClient = google.drive({ version: 'v3', auth });
  gmailClient = google.gmail({ version: 'v1', auth });
  calendarClient = google.calendar({ version: 'v3', auth });
  peopleClient = google.people({ version: 'v1', auth });
  return true;
}

// ─── Drive ─────────────────────────────────────────────────

export async function createDriveDocument(
  title: string,
  content: string,
  mimeType: 'text/plain' | 'text/html' = 'text/plain'
): Promise<{ id: string; url: string } | null> {
  if (!ensureClients()) return null;

  try {
    // Create a blank file first
    const file = await driveClient!.files.create({
      requestBody: {
        name: title,
        mimeType: 'application/vnd.google-apps.document',
      },
      fields: 'id,webViewLink',
    });

    if (!file.data.id) return null;

    // Write content via Google Docs API (import text)
    const media = {
      mimeType,
      body: content,
    };

    await driveClient!.files.update({
      fileId: file.data.id,
      media,
    });

    return { id: file.data.id || '', url: file.data.webViewLink || '' };
  } catch (error) {
    console.error('Drive document creation error:', error);
    return null;
  }
}

export async function uploadToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/plain',
  folderName?: string
): Promise<{ id: string; url: string } | null> {
  if (!ensureClients()) return null;

  try {
    // Find or create folder
    let folderId: string | undefined;
    if (folderName) {
      const escaped = folderName.replace(/'/g, "\\'");
      const folderQuery = await driveClient!.files.list({
        q: `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });
      if (folderQuery.data.files?.length && folderQuery.data.files[0].id) {
        folderId = folderQuery.data.files[0].id;
      } else {
        const folder = await driveClient!.files.create({
          requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
          fields: 'id',
        });
        if (folder.data.id) folderId = folder.data.id;
      }
    }

    const file = await driveClient!.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : [],
      },
      media: { mimeType, body: content },
      fields: 'id,webViewLink',
    });

    return { id: file.data.id || '', url: file.data.webViewLink || '' };
  } catch (error) {
    console.error('Drive upload error:', error);
    return null;
  }
}

// ─── Gmail ─────────────────────────────────────────────────

export async function sendEmail(options: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  attachments?: { filename: string; content: string; encoding?: string }[];
}): Promise<{ id: string } | null> {
  if (!ensureClients()) return null;

  try {
    const boundary = `boundary_${Date.now()}`;
    let messageParts = [
      `From: ${config.google.gmailSender || 'crm@amplify.app'}`,
      `To: ${options.to}`,
      options.cc ? `Cc: ${options.cc}` : '',
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(options.body).toString('base64'),
    ].filter(Boolean);

    if (options.attachments) {
      for (const att of options.attachments) {
        messageParts.push(
          `--${boundary}`,
          `Content-Type: application/octet-stream; name="${att.filename}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${att.filename}"`,
          '',
          att.content
        );
      }
    }

    messageParts.push(`--${boundary}--`);

    const raw = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await gmailClient!.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    return { id: res.data.id || '' };
  } catch (error) {
    console.error('Gmail send error:', error);
    return null;
  }
}

// ─── Calendar ──────────────────────────────────────────────

export async function createCalendarEvent(options: {
  summary: string;
  description?: string;
  startTime: string; // ISO
  endTime?: string;
  attendees?: { email: string }[];
  conferenceData?: boolean;
}): Promise<{ id: string; htmlLink: string } | null> {
  if (!ensureClients()) return null;

  try {
    const endTime = options.endTime || new Date(new Date(options.startTime).getTime() + 60 * 60 * 1000).toISOString();
    const event: calendar_v3.Schema$Event = {
      summary: options.summary,
      description: options.description,
      start: { dateTime: options.startTime, timeZone: 'Africa/Nairobi' },
      end: { dateTime: endTime, timeZone: 'Africa/Nairobi' },
      attendees: options.attendees,
    };

    if (options.conferenceData) {
      event.conferenceData = {
        createRequest: { requestId: `crm-${Date.now()}` },
      };
    }

    const res = await calendarClient!.events.insert({
      calendarId: config.google.calendarId || 'primary',
      requestBody: event,
      conferenceDataVersion: options.conferenceData ? 1 : 0,
    });

    return { id: res.data.id || '', htmlLink: res.data.htmlLink || '' };
  } catch (error) {
    console.error('Calendar event creation error:', error);
    return null;
  }
}

// ─── Contacts ──────────────────────────────────────────────

export async function createContact(options: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}): Promise<{ resourceName: string } | null> {
  if (!ensureClients()) return null;

  try {
    const res = await peopleClient!.people.createContact({
      requestBody: {
        names: [{ givenName: options.name }],
        emailAddresses: [{ value: options.email }],
        ...(options.phone ? { phoneNumbers: [{ value: options.phone }] } : {}),
        ...(options.company ? { organizations: [{ name: options.company }] } : {}),
      },
    });

    return { resourceName: res.data.resourceName || '' };
  } catch (error) {
    console.error('Contact creation error:', error);
    return null;
  }
}
