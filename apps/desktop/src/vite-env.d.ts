/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_DISTRIBUTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
