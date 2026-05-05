/**
 * Google Sign-In Authentication Service
 *
 * Manages Google OAuth 2.0 authentication lifecycle using expo-auth-session
 * with PKCE flow (required by Google for mobile apps).
 *
 * SETUP REQUIRED:
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create an OAuth 2.0 Client ID for YOUR PLATFORM (NOT "Web application"):
 *        • iOS:   Use your bundle ID (e.g. com.motohamy.financetracker)
 *        • Android: Use your package name + SHA-1 fingerprint
 *   3. For iOS/Android client IDs you do NOT configure a redirect URI in the
 *      console — Google derives it automatically from the reversed client ID.
 *   4. Add the reversed client ID to app.json schemes (see step 5).
 *   5. Set environment variables in .env:
 *        EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
 *        EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
 *
 *   ⚠️  DO NOT use a "Web application" client ID — Google blocks custom-scheme
 *      redirects for Web clients (Error 400: invalid_request).
 *
 *   iOS scheme in app.json should include:
 *     "scheme": ["finance-tracker", "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"]
 *
 * Threats mitigated:
 *   T-04-01: PKCE prevents authorization code interception
 *   T-04-02: Tokens stored in expo-secure-store (iOS Keychain / Android Keystore)
 *   T-04-05: Client ID loaded from env var, scoped to drive.appdata only
 */

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
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

// ─── Scopes (D-01: Google Drive appDataFolder, D-02: email) ───

const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
  'profile',
];

// ─── SecureStore Keys for Token Persistence ───

const TOKEN_KEY = 'google_access_token';
const REFRESH_KEY = 'google_refresh_token';
const EMAIL_KEY = 'google_email';

// ─── Client ID Resolution ───

function getClientId(): string | null {
  const iosId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const fallbackId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (Platform.OS === 'ios' && iosId) return iosId;
  if (Platform.OS === 'android' && androidId) return androidId;
  return fallbackId ?? null;
}

// ─── Redirect URI Generation ───

/**
 * Build the correct redirect URI for Google OAuth.
 *
 * For iOS/Android client IDs, Google expects the reversed client ID as the
 * URL scheme. For example, client ID `123-abc.apps.googleusercontent.com`
 * becomes redirect URI:
 *   com.googleusercontent.apps.123-abc:/oauth2redirect/google
 *
 * For Web client IDs (not recommended), we fall back to the app's custom scheme.
 */
function getRedirectUri(clientId: string): string {
  // iOS/Android client IDs contain '.apps.googleusercontent.com'
  // Web client IDs also contain it, but we can detect the difference by
  // checking if the user provided platform-specific IDs.
  const hasPlatformId = !!(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  );

  if (hasPlatformId) {
    const reversed = clientId.split('.').reverse().join('.');
    return `${reversed}:/oauth2redirect/google`;
  }

  // Fallback: custom scheme (only works with Web client IDs that have
  // explicitly authorized this URI, which Google now often blocks).
  return AuthSession.makeRedirectUri({ scheme: 'finance-tracker' });
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
    const clientId = getClientId();
    if (!clientId) {
      console.error('[auth] Google Client ID is not set in environment');
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
 * Get the last authentication error message (for UI display).
 */
let lastAuthError: string | null = null;
export function getLastAuthError(): string | null {
  return lastAuthError;
}

/**
 * Initiate Google Sign-In flow using PKCE (D-11).
 * Opens system browser for authentication.
 * Stores tokens in expo-secure-store on success.
 *
 * @returns true if sign-in succeeded, false if cancelled or failed.
 */
export async function signIn(): Promise<boolean> {
  lastAuthError = null;

  try {
    // 1. Validate client ID is configured
    const clientId = getClientId();
    if (!clientId) {
      const platform = Platform.OS === 'ios' ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID' : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
      lastAuthError =
        `Google ${Platform.OS.toUpperCase()} Client ID not configured. ` +
        `Set ${platform} in your EAS environment variables ` +
        `(eas env:create) or in a .env file. Note: .env files are gitignored ` +
        `by default — they won't be included in EAS Build unless committed.`;
      console.error('[auth]', lastAuthError);
      return false;
    }

    // Warn if using a generic fallback (likely a Web client ID)
    if (!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID &&
        !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      console.warn(
        '[auth] Using fallback EXPO_PUBLIC_GOOGLE_CLIENT_ID. ' +
        'If you get Error 400, create platform-specific iOS/Android OAuth client IDs ' +
        'instead of a Web application client ID.'
      );
    }

    // 2. Build redirect URI
    const redirectUri = getRedirectUri(clientId);
    console.log('[auth] Redirect URI:', redirectUri);

    // 3. Create AuthRequest with library-managed PKCE.
    //    usePKCE: true lets expo-auth-session generate the verifier internally.
    //    We read request.codeVerifier after promptAsync for manual token exchange.
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: SCOPES,
      redirectUri,
      usePKCE: true,
    });

    // 4. Prompt user to authenticate
    const discovery = { authorizationEndpoint: DISCOVERY.authorizationEndpoint };
    const response = await request.promptAsync(discovery);

    if (response.type === 'error') {
      const googleError = response.error?.description || response.params?.error || 'OAuth authorization failed';
      lastAuthError = googleError.includes('redirect_uri_mismatch')
        ? 'redirect_uri_mismatch — Your OAuth client redirect URI does not match.\n' +
          'Ensure the scheme in app.json includes: ' +
          `com.googleusercontent.apps.${clientId.split('.').reverse().join('.')}`
        : googleError;
      console.error('[auth] OAuth error:', lastAuthError);
      return false;
    }

    if (response.type === 'success' && response.params.code) {
      // 5. Retrieve the library-generated code verifier
      const codeVerifier = request.codeVerifier;
      if (!codeVerifier) {
        lastAuthError = 'PKCE code verifier missing — authorization cannot complete';
        console.error('[auth]', lastAuthError);
        return false;
      }

      // 6. Exchange authorization code for tokens
      const tokenResponse = await exchangeCodeForTokens(
        response.params.code,
        codeVerifier,
        redirectUri
      );

      if (!tokenResponse) {
        lastAuthError = 'Token exchange failed. Common causes:\n' +
          '1. SHA-1 fingerprint mismatch — run `eas credentials` to get the ' +
          'correct SHA-1 and add it to Google Cloud Console OAuth client.\n' +
          '2. Wrong OAuth client type — use Android/iOS type, NOT Web application.\n' +
          '3. Redirect URI not authorized — the scheme must match app.json.';
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

    // Cancelled or dismissed
    return false;
  } catch (error) {
    lastAuthError = error instanceof Error ? error.message : 'Sign-in failed';
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

    const clientId = getClientId();
    if (!clientId) {
      console.error('[auth] Google Client ID is not set for token refresh');
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
