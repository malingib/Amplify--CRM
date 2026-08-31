import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { config } from '../config';
import { triggerWorkflows } from '../lib/workflowEngine';

const router = Router();

// Shared Gemini interpretation (reuses logic from Telegram path)
async function interpretWithGemini(text: string): Promise<{
  intent: string;
  response_text: string;
  data?: any;
}> {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    return { intent: 'GENERAL_CHAT', response_text: 'AI is not configured. Please set GEMINI_API_KEY.' };
  }

  const prompt = `
    You are "Amplify Copilot" for Google Chat. Parse this command:
    "${text}"
    Supported intents: CREATE_LEAD, QUERY_LEADS, SYSTEM_STATUS, GENERAL_CHAT.
    Return JSON: { "intent": string, "response_text": string, "data": {} }
  `;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    const json: any = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw);
  } catch {
    return { intent: 'GENERAL_CHAT', response_text: 'Sorry, I had trouble processing that.' };
  }
}

// POST /api/googlechat/webhook — called by Google Chat HTTP bot
router.post('/webhook', async (req, res: Response) => {
  try {
    // Verify token if configured
    const expectedToken = config.google.chatVerificationToken;
    const receivedToken = req.headers['x-goog-chat-token'] as string;
    if (expectedToken && receivedToken && receivedToken !== expectedToken) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const event = req.body;
    const messageText = event.message?.argumentText?.trim() || event.message?.text?.trim() || '';
    const senderEmail = event.message?.sender?.email || '';
    const spaceName = event.space?.displayName || 'CRM Workspace';

    if (!messageText) {
      res.json({ text: 'Hi! Try */pipeline*, */tasks*, */status*, or */create <name> <value>*' });
      return;
    }

    // Handle slash commands directly (no AI latency)
    const lower = messageText.toLowerCase();
    if (lower.startsWith('/pipeline') || lower.startsWith('/leads')) {
      const leadCount = await prisma.lead.count();
      const leadValue = await prisma.lead.aggregate({ _sum: { value: true } });
      res.json({
        text: `📊 *Pipeline Summary*\n• Leads: ${leadCount}\n• Total Value: KES ${(leadValue._sum.value || 0).toLocaleString()}\n• Space: ${spaceName}`,
      });
      return;
    }

    if (lower.startsWith('/tasks')) {
      const pendingTasks = await prisma.task.count({ where: { status: { not: 'Done' } } });
      res.json({ text: `📋 *Pending Tasks:* ${pendingTasks}` });
      return;
    }

    if (lower.startsWith('/status')) {
      res.json({ text: `🟢 *System Online*\n• Role: ${senderEmail ? 'Authenticated' : 'Guest'}\n• Workspace: ${spaceName}` });
      return;
    }

    if (lower.startsWith('/create ')) {
      const parts = messageText.replace('/create ', '').split(/\s+/);
      const name = parts[0] || 'New Lead';
      const value = parseFloat(parts[1]) || 0;
      const lead = await prisma.lead.create({
        data: { name, company: name, value, stage: 'INTAKE', source: 'Google Chat' },
      });
      await triggerWorkflows('lead_created', { lead });
      res.json({ text: `✅ Created lead *${lead.name}* — KES ${value.toLocaleString()}` });
      return;
    }

    // Fall back to Gemini for natural language
    const interpretation = await interpretWithGemini(messageText);
    res.json({ text: interpretation.response_text });
  } catch (error) {
    console.error('Google Chat webhook error:', error);
    res.json({ text: '⚠️ Internal error. Please check the server logs.' });
  }
});

export default router;
