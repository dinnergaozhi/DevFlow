import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { createMockAdapter } from '@/mock'
import { storage } from './storage'
import type { ApiResponse } from '@/types'

const TOKEN_KEY = 'token'
/** 默认走内置 mock；接真实 FastAPI 时设 VITE_USE_MOCK=false，请求会经 /api 代理打到 8000 端口 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const TOKEN_STORAGE_KEY = TOKEN_KEY

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// mock 只替换传输层，拦截器逻辑与真实后端完全一致
if (USE_MOCK) {
  service.defaults.adapter = createMockAdapter(service.defaults.baseURL || '/api')
}

/** 请求头自动带 Authorization: Bearer token（方案 5.1） */
service.interceptors.request.use((config) => {
  const token = storage.get<string>(TOKEN_KEY, '')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let redirecting = false

async function redirectToLogin(): Promise<void> {
  if (redirecting) return
  redirecting = true
  storage.remove(TOKEN_KEY)
  storage.remove('user')
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  // 动态引入，避免 request -> router -> store -> request 的循环依赖
  const { default: router } = await import('@/router')
  await router.replace({ path: '/login', query: { redirect } })
  redirecting = false
}

/** 响应拦截器拆包：直接返回 data，错误统一提示（方案 5.1） */
service.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown> | unknown
    if (body && typeof body === 'object' && 'code' in (body as Record<string, unknown>)) {
      const result = body as ApiResponse<unknown>
      if (result.code !== 0) {
        const error = new Error(result.msg || '请求失败') as Error & { code?: number }
        error.code = result.code
        throw error
      }
      return result.data as never
    }
    return body as never
  },
  async (error: AxiosError<{ msg?: string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.msg ||
      (status === 404 ? '请求的资源不存在' : '') ||
      (status === 500 ? '服务端开小差了' : '') ||
      (error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '') ||
      error.message ||
      '网络异常'

    if (status === 401) {
      await redirectToLogin()
    }
    return Promise.reject(new Error(message))
  },
)

/** 业务代码只需要 http.get / http.post，token 与拆包都在这一层解决 */
export const http = {
  get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, { params, ...config }) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown): Promise<T> {
    return service.put(url, data) as unknown as Promise<T>
  },
  delete<T>(url: string): Promise<T> {
    return service.delete(url) as unknown as Promise<T>
  },
}

export default service
