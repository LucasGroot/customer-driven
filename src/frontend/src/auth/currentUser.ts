/**
 * The signed-in user as the API sees them. The API decides the role, so the
 * dashboard asks it instead of reading the role from the Microsoft token.
 */

export interface CurrentUser {
  name: string;
  email: string;
  role: "user" | "admin";
}

export async function fetchCurrentUser(accessToken: string): Promise<CurrentUser> {
  const response = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401) {
    throw new Error("API-et godtok ikke innloggingen. Logg ut og prøv med jobbkontoen din.");
  }
  if (!response.ok) {
    throw new Error(
      `Fikk ikke kontakt med API-et (${String(response.status)}). Sjekk at det kjører, og last inn siden på nytt.`,
    );
  }
  return (await response.json()) as CurrentUser;
}
