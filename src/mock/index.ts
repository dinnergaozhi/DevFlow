import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { dispatch, MockHttpError } from './handlers'

/**
 * 内置 mock 适配器：只替换 axios 的传输层。
 * 请求/响应拦截器（token、{code,data,msg} 拆包、401 跳登录）走的仍是真实链路，
 * 所以接真实 FastAPI 时只要把 VITE_USE_MOCK 设为 false 即可，业务代码零改动。
 */
export function createMockAdapter(baseURL: string): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method || 'get').toUpperCase()
    let url = config.url || ''
    if (baseURL && url.startsWith(baseURL)) url = url.slice(baseURL.length)

    const [rawPath, search = ''] = url.split('?')
    const query: Record<string, string> = {}
    new URLSearchParams(search).forEach((value, key) => {
      query[key] = value
    })
    if (config.params && typeof config.params === 'object') {
      for (const [key, value] of Object.entries(config.params as Record<string, unknown>)) {
        if (value === undefined || value === null || value === '') continue
        query[key] = String(value)
      }
    }

    let body: Record<string, unknown> = {}
    if (typeof config.data === 'string' && config.data) {
      try {
        body = JSON.parse(config.data) as Record<string, unknown>
      } catch {
        body = {}
      }
    } else if (config.data && typeof config.data === 'object') {
      body = config.data as Record<string, unknown>
    }

    const authHeader = String(config.headers?.get?.('Authorization') ?? '')
    const tokenMatch = /mock-token-(\d+)/.exec(authHeader)
    const userId = tokenMatch ? Number(tokenMatch[1]) : null

    // 模拟网络抖动，让骨架屏/加载态能被真实看到
    await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 180))

    let status = 200
    let payload: { code: number; data: unknown; msg: string }

    try {
      const data = await dispatch(method, rawPath, query, body, userId)
      payload = { code: 0, data, msg: 'ok' }
    } catch (error) {
      const known = error as MockHttpError
      status = known.status || 500
      payload = { code: status, data: null, msg: known.message || '服务端异常' }
    }

    const response = {
      data: payload,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { 'content-type': 'application/json' },
      config,
      request: {},
    } as unknown as AxiosResponse

    if (status === 200) return response

    throw new AxiosError(
      payload.msg,
      status === 401 ? 'ERR_UNAUTHORIZED' : 'ERR_BAD_RESPONSE',
      config,
      {},
      response,
    )
  }
}
