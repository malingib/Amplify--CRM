import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { createDriveDocument, uploadToDrive, sendEmail, createCalendarEvent, createContact } from '../lib/googleWorkspace';

const router = Router();

// POST /api/workspace/drive/create — create a Google Doc from content
router.post('/drive/create', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, mimeType } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }
    const result = await createDriveDocument(title, content, mimeType);
    if (!result) {
      res.status(503).json({ error: 'Google Drive not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY.' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Drive create error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// POST /api/workspace/drive/upload — upload a file
router.post('/drive/upload', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, content, mimeType, folderName } = req.body;
    if (!fileName || !content) {
      res.status(400).json({ error: 'fileName and content are required' });
      return;
    }
    const result = await uploadToDrive(fileName, content, mimeType, folderName);
    if (!result) {
      res.status(503).json({ error: 'Google Drive not configured.' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Drive upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// POST /api/workspace/gmail/send — send an email
router.post('/gmail/send', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, body, cc } = req.body;
    if (!to || !subject || !body) {
      res.status(400).json({ error: 'to, subject, and body are required' });
      return;
    }
    const result = await sendEmail({ to, subject, body, cc });
    if (!result) {
      res.status(503).json({ error: 'Gmail not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY.' });
      return;
    }
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Gmail send error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// POST /api/workspace/calendar/create — create a calendar event
router.post('/calendar/create', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const { summary, description, startTime, endTime, attendees, conferenceData } = req.body;
    if (!summary || !startTime) {
      res.status(400).json({ error: 'summary and startTime are required' });
      return;
    }
    const result = await createCalendarEvent({ summary, description, startTime, endTime, attendees, conferenceData });
    if (!result) {
      res.status(503).json({ error: 'Google Calendar not configured.' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Calendar create error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST /api/workspace/contacts/create — create a Google Contact
router.post('/contacts/create', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, company } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'name and email are required' });
      return;
    }
    const result = await createContact({ name, email, phone, company });
    if (!result) {
      res.status(503).json({ error: 'Google Contacts not configured.' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Contact create error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

export default router;
