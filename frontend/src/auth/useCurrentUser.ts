/**
 * Gets a token for the API and asks it who the signed-in Microsoft account is.
 */

import { CacheLookupPolicy, type AccountInfo } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { fetchCurrentUser, type CurrentUser } from "./currentUser";
import { API_SCOPES } from "./msalConfig";

export type CurrentUserState =
  | { status: "loading" }
  | { status: "signedIn"; user: CurrentUser; accessToken: string }
  | { status: "failed"; message: string };

export function useCurrentUser(): CurrentUserState {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const [state, setState] = useState<CurrentUserState>({ status: "loading" });

  useEffect(() => {
    if (account === undefined) return;
    let cancelled = false;

    async function load(signedInAccount: AccountInfo) {
      let accessToken: string;
      try {
        // Renewing through a hidden iframe would need a separate bridge page in
        // MSAL v5, so an expired session goes back through sign-in instead.
        const result = await instance.acquireTokenSilent({
          scopes: API_SCOPES,
          account: signedInAccount,
          cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken,
        });
        accessToken = result.accessToken;
      } catch {
        await instance.acquireTokenRedirect({ scopes: API_SCOPES, account: signedInAccount });
        return;
      }
      try {
        const user = await fetchCurrentUser(accessToken);
        if (!cancelled) setState({ status: "signedIn", user, accessToken });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!cancelled) setState({ status: "failed", message });
      }
    }

    void load(account);
    return () => {
      cancelled = true;
    };
  }, [instance, account]);

  return state;
}