/**
 * Microsoft Entra sign-in settings. The dashboard signs in against the same app
 * registration the API checks tokens for, so both read their IDs from the
 * repository's root .env.
 */

import { PublicClientApplication } from "@azure/msal-browser";

function readSetting(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`Mangler ${name} i .env. Se README.`);
  }
  return value;
}

const tenantId = readSetting("VITE_ENTRA_TENANT_ID", import.meta.env.VITE_ENTRA_TENANT_ID);
const clientId = readSetting("VITE_ENTRA_CLIENT_ID", import.meta.env.VITE_ENTRA_CLIENT_ID);

// The API only accepts tokens issued to its own app registration, so the
// dashboard asks for the scope that registration exposes, not a Graph scope.
export const API_SCOPES = [`api://${clientId}/access_as_user`];

// Tokens are kept in sessionStorage (MSAL's default), so closing the tab ends
// the sign-in on a shared computer.
export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
});

// Always shows Microsoft's account picker, so after signing out the user can
// pick the same account again or switch to another one.
export function signIn(): Promise<void> {
  return msalInstance.loginRedirect({ scopes: API_SCOPES, prompt: "select_account" });
}

// Signs out of the dashboard only. Microsoft's own sign-out page asks which
// account to sign out and does not always send the user back, leaving MSAL
// stuck mid-logout. clearCache does not notify MsalProvider, so the page is
// reloaded, which also drops the previous user's state.
export async function signOut(): Promise<void> {
  await msalInstance.clearCache();
  window.location.reload();
}
