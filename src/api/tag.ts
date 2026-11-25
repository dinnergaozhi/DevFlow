import { http } from '@/utils/request'
import type { Author, Category, SiteStats, Tag } from '@/types'

export function getTags(limit?: number): Promise<Tag[]> {
  return http.get<Tag[]>('/tags', limit ? { limit } : undefined)
}

export function getTag(id: number): Promise<Tag> {
  return http.get<Tag>(`/tags/${id}`)
}

export function getCategories(): Promise<Category[]> {
  return http.get<Category[]>('/categories')
}

export function getAuthors(params: { sort?: 'followers' | 'articles'; limit?: number } = {}): Promise<Author[]> {
  return http.get<Author[]>('/authors', params as Record<string, unknown>)
}

export function getAuthor(id: number): Promise<Author> {
  return http.get<Author>(`/authors/${id}`)
}

export function getSiteStats(): Promise<SiteStats> {
  return http.get<SiteStats>('/stats')
}
