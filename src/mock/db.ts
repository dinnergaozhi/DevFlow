import type { Author, Article, Category, SiteStats, Tag, User } from '@/types'

/** mock 数据来自 public/data/*.json，由 scripts/gen_mock_data.py 生成（与 blog_seed_data.sql 同源） */
const cache = new Map<string, Promise<unknown>>()

function load<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    const request = fetch(`/data/${name}.json`).then((res) => {
      if (!res.ok) throw new Error(`mock 数据加载失败: ${name}`)
      return res.json() as Promise<T>
    })
    cache.set(name, request)
  }
  return cache.get(name) as Promise<T>
}

export interface AuthorRecord extends Author {}
export interface UserRecord extends User {
  password: string
}

export async function loadArticles(): Promise<Article[]> {
  return load<Article[]>('articles')
}
export async function loadTags(): Promise<Tag[]> {
  return load<Tag[]>('tags')
}
export async function loadAuthors(): Promise<AuthorRecord[]> {
  return load<AuthorRecord[]>('authors')
}
export async function loadUsers(): Promise<UserRecord[]> {
  return load<UserRecord[]>('users')
}
export async function loadCategories(): Promise<Category[]> {
  return load<Category[]>('categories')
}
export async function loadSeedFavorites(): Promise<Record<string, { article_id: number; created_at: string }[]>> {
  return load<Record<string, { article_id: number; created_at: string }[]>>('favorites')
}
export async function loadSeedHistory(): Promise<Record<string, { article_id: number; viewed_at: string }[]>> {
  return load<Record<string, { article_id: number; viewed_at: string }[]>>('history')
}

/** 浏览量 / 点赞量这类会变的字段，mock 期间放在内存里累加 */
const viewDelta = new Map<number, number>()
const likeCount = new Map<number, number>()

export function bumpView(id: number, base: number): number {
  const next = (viewDelta.get(id) ?? base) + 1
  viewDelta.set(id, next)
  return next
}

export function currentViews(id: number, base: number): number {
  return viewDelta.get(id) ?? base
}

export function setLikeCount(id: number, count: number): void {
  likeCount.set(id, count)
}

export function likeCountOf(id: number, base: number): number {
  return likeCount.get(id) ?? base
}

/** 按用户维度持久化的互动状态（收藏 / 点赞 / 足迹），刷新页面不丢 */
export interface MockUserState {
  favorites: { article_id: number; created_at: string }[]
  likes: number[]
  history: { article_id: number; viewed_at: string }[]
}

const STATE_PREFIX = 'mock-state-'

export async function getState(userId: number | null): Promise<MockUserState> {
  const key = STATE_PREFIX + (userId ?? 'guest')
  const raw = localStorage.getItem(key)
  if (raw) {
    try {
      return JSON.parse(raw) as MockUserState
    } catch {
      /* fallthrough */
    }
  }
  const seedFavs = userId ? (await loadSeedFavorites())[String(userId)] ?? [] : []
  const seedHist = userId ? (await loadSeedHistory())[String(userId)] ?? [] : []
  const state: MockUserState = {
    favorites: seedFavs.map((f) => ({ article_id: f.article_id, created_at: f.created_at })),
    likes: [],
    history: seedHist.map((h) => ({ article_id: h.article_id, viewed_at: h.viewed_at })),
  }
  localStorage.setItem(key, JSON.stringify(state))
  return state
}

export async function saveState(userId: number | null, state: MockUserState): Promise<void> {
  localStorage.setItem(STATE_PREFIX + (userId ?? 'guest'), JSON.stringify(state))
}

/** 注册出来的本地账号 */
const LOCAL_USERS_KEY = 'mock-local-users'

export function getLocalUsers(): UserRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]') as UserRecord[]
  } catch {
    return []
  }
}

export function saveLocalUsers(users: UserRecord[]): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

export const stats = async (): Promise<SiteStats> => {
  const [articles, tags, authors] = await Promise.all([loadArticles(), loadTags(), loadAuthors()])
  const published = articles.filter((a) => a.status === 1)
  return {
    articles: published.length,
    tags: tags.length,
    authors: authors.length,
    views: published.reduce((sum, a) => sum + a.views, 0),
  }
}
