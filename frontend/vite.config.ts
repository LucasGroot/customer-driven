import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
 * Security headers, applied to the dev and preview servers so that a header the
 * app relies on is not first discovered to be missing after deployment.
 *
 * Whatever serves the built output must send these too, plus the full CSP
 * below. The CSP in index.html is a <meta> tag, and frame-ancestors is ignored
 * there - clickjacking protection only takes effect as a real header:
 *
 *   Content-Security-Policy: default-src 'self'; script-src 'self';
 *     style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';
 *     connect-src 'self'; object-src 'none'; base-uri 'none';
 *     form-action 'none'; frame-ancestors 'none'
 *   Strict-Transport-Security: max-age=31536000; includeSubDomains
 *
 * style-src needs 'unsafe-inline' because the coverage and weighting meters set
 * their width through an inline style attribute. If the backend ever lands on a
 * different origin, that origin has to be added to connect-src.
 */
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

export default defineConfig({
  plugins: [react()],
  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
  build: { sourcemap: false },
});
