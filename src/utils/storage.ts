/** localStorage 的安全读写，统一 key 前缀，避免与其它站点数据混在一起 */

const PREFIX = 'ajt:'

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      /* 隐私模式下会抛错，忽略即可 */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      /* noop */
    }
  },
}

/** 浏览上报去重：同一篇文章在同一个标签页只上报一次（方案 5.3） */
const REPORT_KEY = 'ajt:reported'

export function markReported(articleId: number): boolean {
  try {
    const raw = sessionStorage.getItem(REPORT_KEY)
    const ids: number[] = raw ? JSON.parse(raw) : []
    if (ids.includes(articleId)) return false
    ids.push(articleId)
    sessionStorage.setItem(REPORT_KEY, JSON.stringify(ids.slice(-200)))
    return true
  } catch {
    return true
  }
}
