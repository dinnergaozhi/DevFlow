/** 数值 / 时间的展示格式化 */

/** 12043 -> 1.2 万 */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, '')} 亿`
  if (value >= 10_000) return `${(value / 10_000).toFixed(1).replace(/\.0$/, '')} 万`
  return String(value)
}

/** 相对时间：3 分钟前 / 2 小时前 / 5 天前 / 2026-03-01 */
export function formatRelativeTime(input: string): string {
  if (!input) return ''
  const time = new Date(input.replace(' ', 'T')).getTime()
  if (Number.isNaN(time)) return input
  const diff = Date.now() - time
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < 0) return formatDate(input)
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(input)
}

export function formatDate(input: string): string {
  if (!input) return ''
  return input.slice(0, 10)
}

export function formatDateTime(input: string): string {
  if (!input) return ''
  return input.replace('T', ' ').slice(0, 16)
}

/** 阅读时长估算：中文按 400 字/分钟 */
export function readingMinutes(markdown: string): number {
  const text = markdown.replace(/```[\s\S]*?```/g, ' ')
  const chars = text.replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 400))
}

/** 作者 / 用户头像取首字（配合渐变底色使用，避免依赖图片资源） */
export function initials(name: string): string {
  if (!name) return '?'
  return name.trim().slice(0, 1).toUpperCase()
}

/** 根据字符串稳定生成 0~359 的色相，用于头像底色 */
export function hueOf(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360
  }
  return hash
}
