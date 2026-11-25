import { http } from '@/utils/request'
import type { Article, Author, ArticleQuery, PageResult } from '@/types'

export function getArticleList(params: ArticleQuery): Promise<PageResult<Article>> {
  return http.get<PageResult<Article>>('/articles', params as Record<string, unknown>)
}

export function getArticleDetail(id: number): Promise<Article> {
  return http.get<Article>(`/articles/${id}`)
}

export function getRelatedArticles(id: number, limit = 5): Promise<Article[]> {
  return http.get<Article[]>(`/articles/${id}/related`, { limit })
}

export function getHotArticles(limit = 8, days = 7): Promise<Article[]> {
  return http.get<Article[]>(`/articles/hot`, { limit, days })
}

/** 点赞 / 取消点赞 */
export function toggleLike(id: number): Promise<{ liked: boolean; likes: number }> {
  return http.post<{ liked: boolean; likes: number }>(`/articles/${id}/like`)
}

/** 浏览上报（详情页 onMounted 调一次，前端已做 sessionStorage 去重） */
export function reportView(id: number): Promise<{ views: number }> {
  return http.post<{ views: number }>(`/articles/${id}/view`)
}

export function searchArticles(keyword: string, page = 1, page_size = 10): Promise<PageResult<Article>> {
  return getArticleList({ keyword, page, page_size })
}

export type { Article, Author }
