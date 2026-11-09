/** The settings the dashboard reads from the repository's root .env. */
interface ImportMetaEnv {
  readonly VITE_ENTRA_TENANT_ID?: string;
  readonly VITE_ENTRA_CLIENT_ID?: string;
}
