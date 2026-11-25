/** 颜色工具：把标签色转成可用的浅底 / 对比色，避免出现深底深字的低对比度问题 */

export function normalizeHex(color: string, fallback = '#2b6cff'): string {
  const value = (color || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  return fallback
}

export function withAlpha(color: string, alpha: number, fallback = '#2b6cff'): string {
  const hex = normalizeHex(color, fallback)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 根据亮度选白字或深字 */
export function readableOn(color: string, fallback = '#2b6cff'): string {
  const hex = normalizeHex(color, fallback)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#1b2333' : '#ffffff'
}

/** 把过亮或过暗的标签色压回可用范围，保证字号小时也看得清 */
export function readableColor(color: string, fallback = '#2b6cff'): string {
  const hex = normalizeHex(color, fallback)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (luminance > 0.72) {
    // 太亮 -> 混入深色
    const mix = (v: number): number => Math.round(v * 0.45)
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
  }
  if (luminance < 0.28) {
    const mix = (v: number): number => Math.round(v + (255 - v) * 0.35)
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
  }
  return hex
}
