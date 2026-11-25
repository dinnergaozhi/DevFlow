/**
 * 与后端 Pydantic schema 一一对应的类型定义。
 * 接真实 FastAPI 时，只需要把这里的字段名对齐 /docs 里的 OpenAPI 定义。
 */

/** 后端统一响应体：{code, data, msg} */
export interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

/** 通用分页结构 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface Tag {
  id: number
  name: string
  description: string
  color: string
  article_count: number
  created_at: string
}

export interface Author {
  id: number
  nickname: string
  real_name: string
  company: string
  title: string
  bio: string
  followers: number
  article_count: number
  created_at: string
}

export interface Article {
  id: number
  title: string
  summary: string
  /** 列表接口不返回正文，详情接口才带 */
  content?: string
  category: string
  tag_id: number
  tag_name: string
  author_id: number
  views: number
  likes: number
  comments: number
  favorites: number
  status: 0 | 1 | 2
  published_at: string
  /** 详情接口联表返回 */
  author?: Author
  tag?: Tag
  /** 当前登录用户是否点赞 / 收藏 */
  liked?: boolean
  favorited?: boolean
}

export type ArticleSort = 'latest' | 'hot'

export interface ArticleQuery {
  page?: number
  page_size?: number
  sort?: ArticleSort
  tag_id?: number
  category?: string
  author_id?: number
  keyword?: string
}

export interface User {
  id: number
  username: string
  nickname: string
  email: string
  points: number
  created_at: string
}

export interface AuthResult {
  token: string
  user: User
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  email: string
  nickname?: string
}

export interface FavoriteItem {
  id: number
  article_id: number
  created_at: string
  article: Article
}

export interface HistoryItem {
  id: number
  article_id: number
  viewed_at: string
  article: Article
}

export interface Category {
  name: string
}

export interface SiteStats {
  articles: number
  tags: number
  authors: number
  views: number
}
