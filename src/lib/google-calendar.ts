import type { CalendarSyncDirection, Task } from "@/types/domain";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  updated?: string;
  status?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getGoogleAuthUrl(state: string) {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const redirectUri = getRequiredEnv("GOOGLE_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
    state
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("GOOGLE_REDIRECT_URI");

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!res.ok) {
    throw new Error("Failed to exchange Google auth code.");
  }

  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string) {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!res.ok) {
    throw new Error("Failed to refresh Google access token.");
  }

  return (await res.json()) as TokenResponse;
}

export async function listCalendarEvents(input: {
  accessToken: string;
  calendarId: string;
  syncToken?: string | null;
}) {
  const params = new URLSearchParams({
    singleEvents: "true",
    showDeleted: "true",
    maxResults: "250"
  });
  if (input.syncToken) {
    params.set("syncToken", input.syncToken);
  } else {
    params.set("timeMin", new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString());
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(input.calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch Google Calendar events.");
  }

  const payload = (await res.json()) as { items?: GoogleEvent[]; nextSyncToken?: string };
  return {
    items: payload.items ?? [],
    nextSyncToken: payload.nextSyncToken ?? null
  };
}

export function taskToGoogleEvent(task: Task) {
  const start = task.startDate ?? task.dueDate ?? new Date().toISOString();
  const end = task.dueDate ?? task.startDate ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return {
    summary: task.title,
    description: task.description ?? "",
    start: { dateTime: start },
    end: { dateTime: end }
  };
}

export function googleEventToTaskPatch(event: GoogleEvent): {
  title?: string;
  description?: string;
  dueDate?: string | null;
  startDate?: string | null;
  syncDirection: CalendarSyncDirection;
} {
  return {
    title: event.summary,
    description: event.description,
    startDate: event.start?.dateTime ?? null,
    dueDate: event.end?.dateTime ?? null,
    syncDirection: "google_to_task"
  };
}

export async function createGoogleEvent(input: {
  accessToken: string;
  calendarId: string;
  task: Task;
}) {
  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(input.calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskToGoogleEvent(input.task))
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create Google calendar event.");
  }

  return (await res.json()) as GoogleEvent;
}

export async function updateGoogleEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  task: Task;
}) {
  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(input.calendarId)}/events/${input.eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskToGoogleEvent(input.task))
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update Google calendar event.");
  }

  return (await res.json()) as GoogleEvent;
}
