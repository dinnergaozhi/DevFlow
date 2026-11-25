import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { getArticleList } from '@/api/article'
import type { Article, ArticleSort } from '@/types'

/**
 * 首页信息流缓存（方案 5.2）：从详情页返回时不重新请求，也不丢失滚动位置。
 * 只缓存首页这一路数据，其它列表用各自的组件内状态。
 */
export const useArticleStore = defineStore('article', () => {
  const list = shallowRef<Article[]>([])
  const page = ref(0)
  const finished = ref(false)
  const loading = ref(false)
  const total = ref(0)
  const category = ref('推荐')
  const sort = ref<ArticleSort>('latest')
  const pageSize = 10

  async function load(reset = false): Promise<void> {
    if (loading.value) return
    loading.value = true
    const nextPage = reset ? 1 : page.value + 1
    try {
      const data = await getArticleList({
        page: nextPage,
        page_size: pageSize,
        sort: sort.value,
        category: category.value === '推荐' ? undefined : category.value,
      })
      list.value = reset ? data.items : [...list.value, ...data.items]
      page.value = data.page
      total.value = data.total
      finished.value = data.page >= data.pages
    } finally {
      loading.value = false
    }
  }

  function setCategory(next: string): boolean {
    if (category.value === next) return false
    category.value = next
    return true
  }

  function setSort(next: ArticleSort): boolean {
    if (sort.value === next) return false
    sort.value = next
    return true
  }

  function patch(articleId: number, patchData: Partial<Article>): void {
    list.value = list.value.map((item) => (item.id === articleId ? { ...item, ...patchData } : item))
  }

  function reset(): void {
    list.value = []
    page.value = 0
    finished.value = false
    total.value = 0
  }

  return {
    list,
    page,
    finished,
    loading,
    total,
    category,
    sort,
    load,
    setCategory,
    setSort,
    patch,
    reset,
  }
})
