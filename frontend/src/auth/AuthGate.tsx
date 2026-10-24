/**
 * Shows the dashboard only once Microsoft has signed the user in and the API
 * has accepted their token; until then, the sign-in page.
 */

import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { App } from "../app/App";
import { signOut } from "./msalConfig";
import { SignInView } from "./SignInView";
import { useCurrentUser } from "./useCurrentUser";

export function AuthGate() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  if (!isAuthenticated) {
    return <SignInView busy={inProgress !== InteractionStatus.None} />;
  }
  return <SignedInApp />;
}

function SignedInApp() {
  const currentUser = useCurrentUser();

  if (currentUser.status === "loading") return <SignInView busy />;
  if (currentUser.status === "failed") {
    return <SignInView busy={false} failureMessage={currentUser.message} />;
  }
  return (
    <App
      user={currentUser.user}
      onSignOut={() => {
        void signOut();
      }}
    />
  );
}
