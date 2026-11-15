/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_SUPER_ADMIN_EMAIL?: string;
  readonly VITE_BACKEND_API_URL?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
