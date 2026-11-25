/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  /** 后端 API 前缀，默认 /api */
  readonly VITE_API_BASE_URL?: string
  /** 是否启用内置 mock（默认 true，接真实 FastAPI 时设为 false） */
  readonly VITE_USE_MOCK?: string
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
