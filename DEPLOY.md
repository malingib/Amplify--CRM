# Deploying Google Workspace Integration

## Prerequisites

1. **Google Cloud Project** with the following APIs enabled:
   - Google OAuth (SSO)
   - Google Drive API
   - Gmail API
   - Google Calendar API
   - People API (Contacts)
   - Google Chat API (bot)

2. **Service Account** with domain-wide delegation:
   - Create in IAM → Service Accounts
   - Enable domain-wide delegation
   - Delegate scopes needed:
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/contacts`

## Steps

### 1. OAuth Consent + Client ID
- Configure OAuth consent screen (External or Internal)
- Create OAuth 2.0 Web Client ID
- Add `http://localhost:5173` and `https://yourdomain.com` to Authorized JS Origins
- Set `VITE_GOOGLE_CLIENT_ID` in `.env` (root)

### 2. Service Account Key
- In Service Account → Keys → Add Key → JSON
- Minify the JSON (one line) and set as `GOOGLE_SERVICE_ACCOUNT_KEY` in `server/.env`
- Set `GMAIL_SENDER` to the service account's delegated sender email

### 3. Google Chat Bot (optional)
- In Cloud Console → Chat API → Manage → Create Bot
- Set bot URL to `https://yourdomain.com/api/googlechat/webhook`
- Set `GOOGLE_CHAT_VERIFICATION_TOKEN` to the bot's verification token
- Set `GOOGLE_ALLOWED_DOMAIN` to restrict Google SSO (e.g., `yourcompany.com`)

### 4. Environment Variables

**Root `.env`:**
- `VITE_GOOGLE_CLIENT_ID`

**`server/.env`:**
- `GOOGLE_CLIENT_ID` — same as above
- `GOOGLE_ALLOWED_DOMAIN` — restrict SSO to this domain
- `GOOGLE_SERVICE_ACCOUNT_KEY` — minified service account JSON
- `GMAIL_SENDER` — email to send from (must be a Google Workspace user)
- `GOOGLE_CALENDAR_ID` — default `primary`
- `GOOGLE_CHAT_VERIFICATION_TOKEN` — Chat bot verification token
- `CORS_ORIGINS` — JSON array or CSV of allowed origins
- `APP_URL` — public URL (used in email links)

### 5. Verify

```bash
# Server
cd server && npm run build && npm start

# Health check
curl https://yourdomain.com/api/health

# Test Drive
curl -X POST https://yourdomain.com/api/workspace/drive/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"Hello World"}'
```
