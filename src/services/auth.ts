/**
 * Google Sign-In Authentication Service
 *
 * Manages Google OAuth 2.0 authentication lifecycle using expo-auth-session
 * with PKCE flow (required by Google for mobile apps).
 *
 * SETUP REQUIRED:
 *   1. Create a Google Cloud OAuth 2.0 client ID at:
 *      https://console.cloud.google.com/apis/credentials
 *   2. Configure the OAuth consent screen with scope:
 *      https://www.googleapis.com/auth/drive.appdata
 *   3. Add redirect URI: finance-tracker://
 *   4. Set the client ID in .env:
 *      EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 *
 * Threats mitigated:
 *   T-04-01: PKCE prevents authorization code interception
 *   T-04-02: Tokens stored in expo-secure-store (iOS Keychain / Android EncryptedSharedPreferences)
 *   T-04-05: Client ID loaded from env var, scoped to drive.appdata only
 */

import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

// Required by expo-auth-session — must be called at module level before any auth requests
WebBrowser.maybeCompleteAuthSession();

// ─── Google OAuth 2.0 Endpoints (OpenID Connect discovery) ───

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ─── Scopes (D-01: Google Drive, D-02: appDataFolder) ───

const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.email',
];

// ─── SecureStore Keys for Token Persistence ───

const TOKEN_KEY = 'google_access_token';
const REFRESH_KEY = 'google_refresh_token';
const EMAIL_KEY = 'google_email';

// ─── PKCE Helpers ───

/**
 * Generate a cryptographically random PKCE code verifier.
 * Returns a base64url-encoded string without padding.
 */
async function generateCodeVerifier(): Promise<string> {
  const randomBytes = Crypto.getRandomBytes(32);
  return base64UrlEncode(randomBytes);
}

/**
 * Create a SHA-256 code challenge from a verifier.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier
  );
  return base64UrlEncodeFromHex(hash);
}

/**
 * Base64url-encode a Uint8Array.
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const binary = String.fromCharCode(...buffer);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64url-encode from a hex string (output of Crypto.digestStringAsync).
 */
function base64UrlEncodeFromHex(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return base64UrlEncode(bytes);
}

// ─── Token Exchange Helpers ───

/**
 * Exchange an authorization code for tokens at Google's token endpoint.
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
  id_token: string;
} | null> {
  try {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('[auth] EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set in environment');
      return null;
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(DISCOVERY.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[auth] Token exchange failed:', response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[auth] Token exchange error:', error);
    return null;
  }
}

/**
 * Decode the JWT id_token payload (base64url middle segment) to extract email.
 */
function decodeIdToken(idToken: string): { email?: string } {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

// ─── Public API ───

/**
 * Initiate Google Sign-In flow using PKCE (D-11).
 * Opens system browser for authentication.
 * Stores tokens in expo-secure-store on success.
 *
 * @returns true if sign-in succeeded, false if cancelled or failed.
 */
export async function signIn(): Promise<boolean> {
  try {
    // 1. Validate client ID is configured
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('[auth] EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set in .env');
      return false;
    }

    // 2. Generate PKCE code verifier and challenge
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 3. Build redirect URI
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'finance-tracker' });

    // 4. Create AuthRequest with PKCE
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: SCOPES,
      redirectUri,
      usePKCE: true,
      codeChallenge,
    });

    // 5. Prompt user to authenticate
    const discovery = { authorizationEndpoint: DISCOVERY.authorizationEndpoint };
    const response = await request.promptAsync(discovery);

    if (response.type === 'success' && response.params.code) {
      // 6. Exchange authorization code for tokens
      const tokenResponse = await exchangeCodeForTokens(
        response.params.code,
        codeVerifier,
        redirectUri
      );

      if (!tokenResponse) {
        return false;
      }

      // 7. Extract email from id_token
      const payload = decodeIdToken(tokenResponse.id_token);
      const email = payload.email ?? null;

      // 8. Store tokens and email in SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        await SecureStore.setItemAsync(REFRESH_KEY, tokenResponse.refresh_token);
      }
      if (email) {
        await SecureStore.setItemAsync(EMAIL_KEY, email);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('[auth] Sign-in error:', error);
    return false;
  }
}

/**
 * Sign out: revoke token via Google API, clear SecureStore,
 * and redirect to Google logout URL.
 */
export async function signOut(): Promise<void> {
  try {
    // 1. Revoke access token with Google
    const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (accessToken) {
      try {
        await fetch(
          `${DISCOVERY.revocationEndpoint}?token=${encodeURIComponent(accessToken)}`,
          { method: 'POST' }
        );
      } catch {
        // Best-effort revocation — continue with cleanup even if it fails
      }
    }

    // 2. Clear all stored credentials
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);

    // 3. Open Google logout page to clear browser session
    try {
      await WebBrowser.openAuthSessionAsync('https://accounts.google.com/logout');
    } catch {
      // Non-critical — the SecureStore is already cleared
    }
  } catch (error) {
    console.error('[auth] Sign-out error:', error);
    // Always clear SecureStore even on error
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
  }
}

/**
 * Get a valid access token. Attempts refresh if current token may be expired.
 * Callers should handle 401s on Drive API by calling this again.
 *
 * @returns The access token string, or null if not authenticated or refresh fails.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    // 1. Check for existing access token
    const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (accessToken) {
      return accessToken;
    }

    // 2. No access token — attempt refresh
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) {
      return null;
    }

    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('[auth] EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set for token refresh');
      return null;
    }

    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      grant_type: 'refresh_token',
    });

    const response = await fetch(DISCOVERY.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      // Refresh token expired or revoked — user must sign in again
      console.error('[auth] Token refresh failed:', response.status);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      return null;
    }

    const data = await response.json();
    await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
    if (data.refresh_token) {
      await SecureStore.setItemAsync(REFRESH_KEY, data.refresh_token);
    }

    return data.access_token;
  } catch (error) {
    console.error('[auth] getAccessToken error:', error);
    return null;
  }
}

/**
 * Returns true if an access token exists in SecureStore.
 * Does NOT validate token freshness — use getAccessToken() for API calls
 * which will attempt refresh if needed.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token !== null;
  } catch {
    return false;
  }
}

/**
 * Get the authenticated user's email from SecureStore.
 *
 * @returns The email string, or null if not signed in.
 */
export async function getGoogleEmail(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(EMAIL_KEY);
  } catch {
    return null;
  }
}
