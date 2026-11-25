import { http } from '@/utils/request'
import type { FavoriteItem, HistoryItem } from '@/types'

export function getFavorites(): Promise<FavoriteItem[]> {
  return http.get<FavoriteItem[]>('/user/favorites')
}

export function addFavorite(articleId: number): Promise<{ favorited: boolean; favorites: number }> {
  return http.post<{ favorited: boolean; favorites: number }>(`/articles/${articleId}/favorite`)
}

export function removeFavorite(articleId: number): Promise<{ favorited: boolean; favorites: number }> {
  return http.delete<{ favorited: boolean; favorites: number }>(`/user/favorites/${articleId}`)
}

export function getHistory(): Promise<HistoryItem[]> {
  return http.get<HistoryItem[]>('/user/history')
}

export function clearHistory(): Promise<{ ok: boolean }> {
  return http.delete<{ ok: boolean }>('/user/history')
}
