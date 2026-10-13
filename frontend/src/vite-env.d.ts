/// <reference types="vite/client" />

// Type the env variables we read via import.meta.env.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
