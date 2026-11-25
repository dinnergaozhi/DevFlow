import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.use({ gfm: true, breaks: false })

/** 标题 slug：中英文都保留，空格转连字符 */
export function slugify(text: string): string {
  return text
    .replace(/[*_`~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface TocItem {
  id: string
  text: string
  level: number
}

/** 从 Markdown 中抽取 h2/h3 目录（详情页右侧锚点导航） */
export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n')
  const toc: TocItem[] = []
  let inCode = false
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode) continue
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (match) {
      const text = match[2]
      toc.push({ id: slugify(text), text, level: match[1].length })
    }
  }
  return toc
}

/**
 * Markdown -> 安全 HTML。
 * 用 DOMPurify 过滤，杜绝文章正文里的 <script> / onerror 之类的 XSS（方案 5.5）。
 */
export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  })
}

/** 渲染后给正文标题补上 id，供目录锚点跳转 */
export function attachHeadingIds(root: HTMLElement | null): void {
  if (!root) return
  const headings = root.querySelectorAll<HTMLElement>('h2, h3')
  headings.forEach((el) => {
    if (!el.id) el.id = slugify(el.textContent || '')
  })
}
