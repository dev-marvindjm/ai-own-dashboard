/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RUST_API_URL: string;
  readonly VITE_SSE_URL: string;
  readonly VITE_MSG_API_URL: string;
  readonly VITE_TOKENIZER_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
