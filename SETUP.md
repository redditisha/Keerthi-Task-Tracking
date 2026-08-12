# Setup Guide

## 1. Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable two APIs:
   - **Google Sheets API**
   - **Google Drive API** (needed for service account sheet access)

## 2. Service Account (for Sheets read/write)

1. Go to IAM & Admin → Service Accounts
2. Create a service account (name it anything, e.g. `content-ops-sheets`)
3. Create a key → JSON → download it
4. Place the file somewhere safe, e.g. `work-tracker/keys/service-account.json`
5. Set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./keys/service-account.json` in `.env.local`

## 3. Google Sheet

1. Create a new Google Sheet
2. Share it with the service account email (from step 2) — give it **Editor** access
3. Create three sheets (tabs) with these exact names:
   - `Tasks`
   - `Team`
   - `Config`
4. Add headers to each sheet:

**Tasks (Row 1):**
```
task_id | task_name | person_id | content_type | format | effort | priority | request_source | deadline | added_at | started_at | completed_at | status | published | notes | created_at | updated_at
```

**Team (Row 1):**
```
person_id | name | role | active | created_at
```

**Config (Row 1):**
```
key | value
```

5. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`
6. Set `GOOGLE_SHEET_ID=your_sheet_id` in `.env.local`

## 4. Google OAuth (for login)

1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web Application
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-domain.com/api/auth/callback/google` (for production)
4. Copy Client ID and Client Secret to `.env.local`

## 5. NextAuth Secret

Generate a random secret:
```bash
openssl rand -base64 32
```
Set it as `NEXTAUTH_SECRET` in `.env.local`

## 6. Run

```bash
cd work-tracker
npm run dev
```

Open http://localhost:3000
