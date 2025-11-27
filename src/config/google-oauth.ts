// Google OAuth Client ID (public, not sensitive)
// Get this from Google Cloud Console > APIs & Credentials
export const GOOGLE_OAUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '';

// OAuth scopes for calendar access
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ');
