import { ref, shallowRef, type Ref } from 'vue'
import { getArticleList } from '@/api/article'
import type { Article, ArticleQuery } from '@/types'

/**
 * 文章列表通用逻辑：分页 + 无限滚动共用一套状态。
 * - loadNext()：追加下一页（首页信息流）
 * - loadPage(n)：替换为第 n 页（列表页分页器）
 */
export function useArticleFeed(getQuery: () => ArticleQuery, pageSize = 10, initialQuery?: ArticleQuery) {
  const items = shallowRef<Article[]>([])
  const loading = ref(false)
  const error = ref('')
  const finished = ref(false)
  const page = ref(0)
  const total = ref(0)
  const pages = ref(1)

  let requestId = 0

  async function fetchPage(targetPage: number, mode: 'append' | 'replace'): Promise<void> {
    const currentId = ++requestId
    loading.value = true
    error.value = ''
    try {
      const data = await getArticleList({ ...initialQuery, ...getQuery(), page: targetPage, page_size: pageSize })
      if (currentId !== requestId) return
      items.value = mode === 'append' ? [...items.value, ...data.items] : data.items
      page.value = data.page
      total.value = data.total
      pages.value = data.pages
      finished.value = data.page >= data.pages
    } catch (err) {
      if (currentId !== requestId) return
      error.value = (err as Error).message || '加载失败'
      finished.value = true
    } finally {
      if (currentId === requestId) loading.value = false
    }
  }

  function loadNext(): Promise<void> {
    if (loading.value || finished.value) return Promise.resolve()
    return fetchPage(page.value + 1, 'append')
  }

  function loadPage(target: number): Promise<void> {
    return fetchPage(target, 'replace')
  }

  function reset(): void {
    items.value = []
    page.value = 0
    finished.value = false
    total.value = 0
  }

  return { items, loading, error, finished, page, total, pages, loadNext, loadPage, reset }
}

export type ArticleFeed = ReturnType<typeof useArticleFeed>

/** 详情页的页面级数据，直接 local ref 即可，不进 store（方案 5.2） */
export function useArticleDetail(loader: () => Promise<Article>) {
  const article = shallowRef<Article | null>(null)
  const loading = ref(true)
  const error = ref('')

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      article.value = await loader()
    } catch (err) {
      error.value = (err as Error).message || '文章加载失败'
    } finally {
      loading.value = false
    }
  }

  return { article, loading, error, load }
}

export type { Ref }
