/**
 * Google Drive API Service
 *
 * Wraps Google Drive REST API v3 for operations within the appDataFolder scope.
 * All sync data is stored as JSON files (D-03). Files are hidden from the
 * user's main Drive view (D-02, appDataFolder).
 *
 * FILE NAMING (D-03, D-06 — granular per-table sync):
 *   sync/categories.json    — Category records array
 *   sync/expenses.json      — Expense records array
 *   sync/trades.json        — Trade records array
 *   sync/current_prices.json — CurrentPrice records array
 *   sync/manifest.json      — SyncManifest metadata
 *
 * THREATS MITIGATED:
 *   T-04-03: HTTPS (TLS 1.3) in transit; appDataFolder ensures file isolation
 *   T-04-04: Bearer token in Authorization header, never in URL params
 *   T-04-06: Rate limiting accepted (10,000 req/day free tier, single-user app)
 *
 * NOTE: The Drive appDataFolder has a hidden quota — files are only accessible
 * via the API with the app's credentials. Users cannot see these files in
 * their Drive UI.
 */

import { getAccessToken } from './auth';
import type { SyncTable, SyncManifest } from '@/types';

// ─── API Endpoints ───

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const SYNC_FOLDER = 'sync'; // Virtual folder prefix within appDataFolder

/** File ID for the sync manifest — always named "manifest.json" */
const MANIFEST_NAME = `${SYNC_FOLDER}/manifest.json`;

// ─── Internal Helpers ───

/**
 * Invalidate the cached access token so the next getAccessToken() call
 * triggers a refresh. We handle this internally by clearing a flag and
 * forcing a re-read from auth service.
 *
 * Since getAccessToken() already handles refresh logic, we simply signal
 * to the auth service that the current token is stale by making a fresh
 * call after a 401.
 */
let tokenRetryInProgress = false;

/**
 * Make an authenticated request to the Google Drive API.
 * Handles 401 → token refresh → retry pattern automatically.
 *
 * @param method - HTTP method (GET, POST, PATCH, DELETE)
 * @param url - Full API URL
 * @param body - Optional request body (string or null)
 * @param contentType - Content-Type header (default: application/json)
 * @returns Response object (caller must parse .json() or .text())
 */
async function makeAuthenticatedRequest(
  method: string,
  url: string,
  body?: string | null,
  contentType: string = 'application/json'
): Promise<Response> {
  // Get a valid access token
  let token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated — call signIn() first');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  let response = await fetch(url, {
    method,
    headers,
    body: body ?? undefined,
  });

  // Handle 401 — token expired, try refresh once
  if (response.status === 401 && !tokenRetryInProgress) {
    tokenRetryInProgress = true;
    try {
      // getAccessToken will attempt refresh since the current token was rejected
      token = await getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        response = await fetch(url, {
          method,
          headers,
          body: body ?? undefined,
        });
      }
    } finally {
      tokenRetryInProgress = false;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive API error (${response.status}): ${errorText}`);
  }

  return response;
}

/**
 * Generate multipart upload body with metadata and JSON content.
 * Follows Google Drive multipart upload format:
 *   --boundary
 *   Content-Type: application/json; charset=UTF-8
 *   {metadata}
 *   --boundary
 *   Content-Type: application/json
 *   {content}
 *   --boundary--
 */
function buildMultipartBody(
  metadata: Record<string, unknown>,
  content: string,
  boundary: string
): string {
  const parts = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ];
  return parts.join('\r\n');
}

// ─── Public API ───

/**
 * List all sync JSON files in appDataFolder.
 *
 * @returns Array of { name, id, modifiedTime } for each sync file found.
 */
export async function listSyncFiles(): Promise<
  Array<{ name: string; id: string; modifiedTime: string }>
> {
  const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&q=name contains 'sync/'`;

  const response = await makeAuthenticatedRequest('GET', url);
  const data = await response.json();

  return (data.files ?? []) as Array<{ name: string; id: string; modifiedTime: string }>;
}

/**
 * Upload JSON data to a file in appDataFolder.
 *
 * Uses multipart upload for new files (POST with metadata + content parts).
 * Uses media upload for updates (PATCH to existing file ID).
 *
 * @param tableName — e.g., "categories" → stored as "sync/categories.json"
 * @param data — the JSON-serializable array of records
 * @param existingFileId — if updating an existing file, pass its Drive file ID (null/undefined for new files)
 * @returns the Drive file ID of the created/updated file
 */
export async function uploadJSON(
  tableName: SyncTable,
  data: unknown[],
  existingFileId?: string | null
): Promise<string> {
  const fileName = `${SYNC_FOLDER}/${tableName}.json`;
  const jsonContent = JSON.stringify(data);

  if (existingFileId) {
    // Update existing file via PATCH with media upload
    const url = `${DRIVE_API_BASE}/files/${existingFileId}?uploadType=media`;
    const response = await makeAuthenticatedRequest(
      'PATCH',
      url,
      jsonContent,
      'application/json'
    );
    const result = await response.json();
    return result.id;
  }

  // Create new file via multipart upload
  const boundary = `drive_boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const metadata = {
    name: fileName,
    parents: ['appDataFolder'],
  };
  const multipartBody = buildMultipartBody(metadata, jsonContent, boundary);

  const url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
  const response = await makeAuthenticatedRequest(
    'POST',
    url,
    multipartBody,
    `multipart/related; boundary=${boundary}`
  );
  const result = await response.json();
  return result.id;
}

/**
 * Download and parse a JSON file from appDataFolder.
 *
 * @param fileId — Drive file ID (from listSyncFiles)
 * @returns parsed JSON array cast to T[]
 */
export async function downloadJSON<T = unknown>(fileId: string): Promise<T[]> {
  const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
  const response = await makeAuthenticatedRequest('GET', url);
  const data = await response.json();
  return data as T[];
}

/**
 * Upload the sync manifest file to appDataFolder.
 *
 * @param manifest — SyncManifest object
 * @param existingFileId — Drive file ID of existing manifest (null/undefined for first upload)
 * @returns the Drive file ID
 */
export async function uploadManifest(
  manifest: SyncManifest,
  existingFileId?: string | null
): Promise<string> {
  // Wrap in array for consistency with uploadJSON array format
  const jsonContent = JSON.stringify([manifest]);

  if (existingFileId) {
    // Update existing manifest
    const url = `${DRIVE_API_BASE}/files/${existingFileId}?uploadType=media`;
    const response = await makeAuthenticatedRequest(
      'PATCH',
      url,
      jsonContent,
      'application/json'
    );
    const result = await response.json();
    return result.id;
  }

  // Create new manifest file
  const boundary = `drive_boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const metadata = {
    name: MANIFEST_NAME,
    parents: ['appDataFolder'],
  };
  const multipartBody = buildMultipartBody(metadata, jsonContent, boundary);

  const url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
  const response = await makeAuthenticatedRequest(
    'POST',
    url,
    multipartBody,
    `multipart/related; boundary=${boundary}`
  );
  const result = await response.json();
  return result.id;
}

/**
 * Download and parse the sync manifest from appDataFolder.
 *
 * @returns SyncManifest or null if no manifest exists yet
 */
export async function downloadManifest(): Promise<SyncManifest | null> {
  try {
    const files = await listSyncFiles();
    const manifestFile = files.find((f) => f.name === MANIFEST_NAME);

    if (!manifestFile) {
      return null;
    }

    const data = await downloadJSON<SyncManifest>(manifestFile.id);
    // Manifest is a single object stored as a single-element array by downloadJSON
    // or it could be the object directly. Handle both cases.
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as SyncManifest;
    }
    return (data as unknown) as SyncManifest;
  } catch (error) {
    console.error('[drive] Failed to download manifest:', error);
    return null;
  }
}

/**
 * Delete a file from appDataFolder by Drive file ID.
 * Silently ignores 404 (file already deleted).
 *
 * @param fileId — Drive file ID to delete
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const url = `${DRIVE_API_BASE}/files/${fileId}`;
    const response = await makeAuthenticatedRequest('DELETE', url);

    // makeAuthenticatedRequest throws on non-ok, but 404 we handle gracefully
    if (response.status === 404) {
      return; // Already deleted — no-op
    }
  } catch (error) {
    // If error message contains 404, it's already deleted
    if (error instanceof Error && error.message.includes('404')) {
      return;
    }
    throw error;
  }
}
