import { MsalProvider } from "@azure/msal-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthGate } from "./auth/AuthGate";
import { msalInstance } from "./auth/msalConfig";
import "./styles/global.css";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Fant ikke #root i index.html.");
}

// Going back from Microsoft's sign-in page can restore this page from the
// browser's back-forward cache, frozen mid sign-in with the button disabled.
// Reloading lets MSAL clear the unfinished sign-in and start over.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});

createRoot(container).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthGate />
    </MsalProvider>
  </StrictMode>,
);
