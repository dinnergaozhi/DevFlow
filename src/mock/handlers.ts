import type { Article, Author, PageResult, Tag, User } from '@/types'
import {
  bumpView,
  currentViews,
  getLocalUsers,
  getState,
  likeCountOf,
  loadArticles,
  loadAuthors,
  loadCategories,
  loadTags,
  loadUsers,
  saveLocalUsers,
  saveState,
  setLikeCount,
  stats,
  type UserRecord,
} from './db'

export class MockHttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface MockContext {
  query: Record<string, string>
  body: Record<string, unknown>
  params: Record<string, string>
  userId: number | null
}

interface Route {
  method: string
  parts: string[]
  handler: (ctx: MockContext) => Promise<unknown>
}

const unauthorized = (): never => {
  throw new MockHttpError(401, '登录已过期，请重新登录')
}

const requireUser = (ctx: MockContext): number => ctx.userId ?? unauthorized()

const toInt = (value: string | undefined, fallback: number): number => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

const withoutContent = (article: Article): Article => {
  const { content: _content, ...rest } = article
  return rest
}

async function decorate(article: Article, userId: number | null): Promise<Article> {
  const [authors, tags] = await Promise.all([loadAuthors(), loadTags()])
  const author = authors.find((a) => a.id === article.author_id)
  const tag = tags.find((t) => t.id === article.tag_id)
  const state = await getState(userId)
  return {
    ...article,
    views: currentViews(article.id, article.views),
    likes: likeCountOf(article.id, article.likes),
    author: author as Author | undefined,
    tag: tag as Tag | undefined,
    liked: state.likes.includes(article.id),
    favorited: state.favorites.some((f) => f.article_id === article.id),
  }
}

function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    pages,
  }
}

const routes: Route[] = [
  {
    method: 'GET',
    parts: ['articles'],
    handler: async (ctx) => {
      const [articles, tags, authors] = await Promise.all([loadArticles(), loadTags(), loadAuthors()])
      const q = ctx.query
      const page = toInt(q.page, 1)
      const pageSize = Math.min(50, toInt(q.page_size, 10))
      const tagId = q.tag_id ? Number(q.tag_id) : undefined
      const authorId = q.author_id ? Number(q.author_id) : undefined
      const category = q.category
      const keyword = (q.keyword || '').trim().toLowerCase()
      const sort = q.sort === 'hot' ? 'hot' : 'latest'

      const tagMap = new Map(tags.map((t) => [t.id, t]))
      const authorMap = new Map(authors.map((a) => [a.id, a]))

      let list = articles.filter((a) => a.status === 1)
      if (tagId) list = list.filter((a) => a.tag_id === tagId)
      if (authorId) list = list.filter((a) => a.author_id === authorId)
      if (category) list = list.filter((a) => a.category === category)
      if (keyword) {
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(keyword) ||
            a.summary.toLowerCase().includes(keyword) ||
            a.tag_name.toLowerCase().includes(keyword),
        )
      }

      if (sort === 'hot') {
        list = [...list].sort((a, b) => b.views - a.views)
      } else {
        list = [...list].sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
      }

      const result = paginate(list, page, pageSize)
      return {
        ...result,
        items: result.items.map((a) => ({
          ...withoutContent(a),
          views: currentViews(a.id, a.views),
          tag: tagMap.get(a.tag_id),
          author: authorMap.get(a.author_id),
        })),
      } satisfies PageResult<Article>
    },
  },
  {
    method: 'GET',
    parts: ['articles', 'hot'],
    handler: async (ctx) => {
      const limit = Math.min(20, toInt(ctx.query.limit, 8))
      const articles = (await loadArticles()).filter((a) => a.status === 1)
      return articles
        .map((a) => ({ ...withoutContent(a), views: currentViews(a.id, a.views) }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
    },
  },
  {
    method: 'GET',
    parts: ['articles', ':id', 'related'],
    handler: async (ctx) => {
      const id = Number(ctx.params.id)
      const limit = Math.min(12, toInt(ctx.query.limit, 5))
      const [articles, authors, tags] = await Promise.all([loadArticles(), loadAuthors(), loadTags()])
      const target = articles.find((a) => a.id === id)
      if (!target) throw new MockHttpError(404, '文章不存在')
      const authorMap = new Map(authors.map((a) => [a.id, a]))
      const tagMap = new Map(tags.map((t) => [t.id, t]))
      return articles
        .filter((a) => a.status === 1 && a.id !== id && a.tag_id === target.tag_id)
        .slice(0, limit)
        .map((a) => ({
          ...withoutContent(a),
          author: authorMap.get(a.author_id),
          tag: tagMap.get(a.tag_id),
        }))
    },
  },
  {
    method: 'GET',
    parts: ['articles', ':id'],
    handler: async (ctx) => {
      const id = Number(ctx.params.id)
      const articles = await loadArticles()
      const article = articles.find((a) => a.id === id)
      if (!article) throw new MockHttpError(404, '文章不存在或已下架')
      if (ctx.userId) {
        const state = await getState(ctx.userId)
        if (!state.history.some((h) => h.article_id === id)) {
          state.history.unshift({ article_id: id, viewed_at: new Date().toISOString().slice(0, 19).replace('T', ' ') })
          await saveState(ctx.userId, state)
        }
      }
      return decorate(article, ctx.userId)
    },
  },
  {
    method: 'POST',
    parts: ['articles', ':id', 'like'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const id = Number(ctx.params.id)
      const [articles, state] = await Promise.all([loadArticles(), getState(userId)])
      const article = articles.find((a) => a.id === id)
      if (!article) throw new MockHttpError(404, '文章不存在')
      const base = likeCountOf(id, article.likes)
      const liked = state.likes.includes(id)
      const likes = liked ? Math.max(0, base - 1) : base + 1
      state.likes = liked ? state.likes.filter((x) => x !== id) : [...state.likes, id]
      setLikeCount(id, likes)
      await saveState(userId, state)
      return { liked: !liked, likes }
    },
  },
  {
    method: 'POST',
    parts: ['articles', ':id', 'favorite'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const id = Number(ctx.params.id)
      const [articles, state] = await Promise.all([loadArticles(), getState(userId)])
      const article = articles.find((a) => a.id === id)
      if (!article) throw new MockHttpError(404, '文章不存在')
      const favorited = state.favorites.some((f) => f.article_id === id)
      if (favorited) {
        state.favorites = state.favorites.filter((f) => f.article_id !== id)
      } else {
        state.favorites.unshift({ article_id: id, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') })
      }
      await saveState(userId, state)
      return { favorited: !favorited, favorites: article.favorites + (favorited ? -1 : 1) }
    },
  },
  {
    method: 'POST',
    parts: ['articles', ':id', 'view'],
    handler: async (ctx) => {
      const id = Number(ctx.params.id)
      const articles = await loadArticles()
      const article = articles.find((a) => a.id === id)
      if (!article) throw new MockHttpError(404, '文章不存在')
      const views = bumpView(id, article.views)
      return { views }
    },
  },
  {
    method: 'GET',
    parts: ['tags'],
    handler: async (ctx) => {
      const tags = await loadTags()
      const limit = ctx.query.limit ? toInt(ctx.query.limit, tags.length) : tags.length
      return [...tags]
        .sort((a, b) => b.article_count - a.article_count)
        .slice(0, limit)
        .map((t) => ({ ...t, color: t.color || '#2b6cff' }))
    },
  },
  {
    method: 'GET',
    parts: ['tags', ':id'],
    handler: async (ctx) => {
      const tags = await loadTags()
      const tag = tags.find((t) => t.id === Number(ctx.params.id))
      if (!tag) throw new MockHttpError(404, '标签不存在')
      return tag
    },
  },
  {
    method: 'GET',
    parts: ['categories'],
    handler: async () => loadCategories(),
  },
  {
    method: 'GET',
    parts: ['authors'],
    handler: async (ctx) => {
      const authors = await loadAuthors()
      const limit = Math.min(50, toInt(ctx.query.limit, 8))
      const sort = ctx.query.sort === 'articles' ? 'articles' : 'followers'
      return [...authors]
        .sort((a, b) =>
          sort === 'articles' ? b.article_count - a.article_count : b.followers - a.followers,
        )
        .slice(0, limit)
    },
  },
  {
    method: 'GET',
    parts: ['authors', ':id'],
    handler: async (ctx) => {
      const authors = await loadAuthors()
      const author = authors.find((a) => a.id === Number(ctx.params.id))
      if (!author) throw new MockHttpError(404, '作者不存在')
      return author
    },
  },
  {
    method: 'GET',
    parts: ['stats'],
    handler: async () => stats(),
  },
  {
    method: 'POST',
    parts: ['auth', 'login'],
    handler: async (ctx) => {
      const username = String(ctx.body.username || '').trim()
      const password = String(ctx.body.password || '')
      const users = [...(await loadUsers()), ...getLocalUsers()]
      const user = users.find((u) => u.username === username)
      if (!user || user.password !== password) {
        throw new MockHttpError(400, '用户名或密码不正确')
      }
      const { password: _pwd, ...profile } = user as UserRecord
      return { token: `mock-token-${profile.id}`, user: profile satisfies User }
    },
  },
  {
    method: 'POST',
    parts: ['auth', 'register'],
    handler: async (ctx) => {
      const username = String(ctx.body.username || '').trim()
      const password = String(ctx.body.password || '')
      const email = String(ctx.body.email || '').trim()
      const nickname = String(ctx.body.nickname || username)
      if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) throw new MockHttpError(400, '用户名需为 4-20 位字母、数字或下划线')
      if (password.length < 6) throw new MockHttpError(400, '密码至少 6 位')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new MockHttpError(400, '邮箱格式不正确')

      const users = [...(await loadUsers()), ...getLocalUsers()]
      if (users.some((u) => u.username === username)) throw new MockHttpError(400, '用户名已被占用')
      if (users.some((u) => u.email === email)) throw new MockHttpError(400, '邮箱已被注册')

      const local = getLocalUsers()
      const id = 10_000 + local.length + 1
      const user: UserRecord = {
        id,
        username,
        password,
        email,
        nickname,
        points: 0,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      saveLocalUsers([...local, user])
      const { password: _pwd, ...profile } = user
      return { token: `mock-token-${profile.id}`, user: profile satisfies User }
    },
  },
  {
    method: 'GET',
    parts: ['auth', 'me'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const users = [...(await loadUsers()), ...getLocalUsers()]
      const user = users.find((u) => u.id === userId)
      if (!user) throw new MockHttpError(401, '登录已过期，请重新登录')
      const { password: _pwd, ...profile } = user
      return profile
    },
  },
  {
    method: 'POST',
    parts: ['auth', 'logout'],
    handler: async () => ({ ok: true }),
  },
  {
    method: 'GET',
    parts: ['user', 'favorites'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const [state, articles, authors, tags] = await Promise.all([
        getState(userId),
        loadArticles(),
        loadAuthors(),
        loadTags(),
      ])
      const authorMap = new Map(authors.map((a) => [a.id, a]))
      const tagMap = new Map(tags.map((t) => [t.id, t]))
      const decorateItem = (article: Article | undefined): Article | undefined =>
        article && { ...withoutContent(article), author: authorMap.get(article.author_id), tag: tagMap.get(article.tag_id) }

      return state.favorites
        .slice()
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((f, index) => ({
          id: index + 1,
          article_id: f.article_id,
          created_at: f.created_at,
          article: decorateItem(articles.find((a) => a.id === f.article_id)),
        }))
        .filter((item) => item.article)
    },
  },
  {
    method: 'DELETE',
    parts: ['user', 'favorites', ':articleId'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const id = Number(ctx.params.articleId)
      const state = await getState(userId)
      state.favorites = state.favorites.filter((f) => f.article_id !== id)
      await saveState(userId, state)
      return { favorited: false, favorites: 0 }
    },
  },
  {
    method: 'GET',
    parts: ['user', 'history'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const [state, articles, authors, tags] = await Promise.all([
        getState(userId),
        loadArticles(),
        loadAuthors(),
        loadTags(),
      ])
      const authorMap = new Map(authors.map((a) => [a.id, a]))
      const tagMap = new Map(tags.map((t) => [t.id, t]))
      const seen = new Set<number>()
      const items = state.history
        .slice()
        .sort((a, b) => (a.viewed_at < b.viewed_at ? 1 : -1))
        .filter((h) => {
          if (seen.has(h.article_id)) return false
          seen.add(h.article_id)
          return true
        })
        .map((h, index) => {
          const article = articles.find((a) => a.id === h.article_id)
          return {
            id: index + 1,
            article_id: h.article_id,
            viewed_at: h.viewed_at,
            article: article && {
              ...withoutContent(article),
              author: authorMap.get(article.author_id),
              tag: tagMap.get(article.tag_id),
            },
          }
        })
        .filter((item) => item.article)
      return items
    },
  },
  {
    method: 'DELETE',
    parts: ['user', 'history'],
    handler: async (ctx) => {
      const userId = requireUser(ctx)
      const state = await getState(userId)
      state.history = []
      await saveState(userId, state)
      return { ok: true }
    },
  },
]

function matchRoute(method: string, parts: string[]): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue
    if (route.parts.length !== parts.length) continue
    const params: Record<string, string> = {}
    let matched = true
    for (let i = 0; i < route.parts.length; i += 1) {
      const expected = route.parts[i]
      if (expected.startsWith(':')) {
        params[expected.slice(1)] = parts[i]
      } else if (expected !== parts[i]) {
        matched = false
        break
      }
    }
    if (matched) return { route, params }
  }
  return null
}

/** 根据请求方法 + 路径找到 mock 处理器，找不到就 404 */
export async function dispatch(
  method: string,
  pathname: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
  userId: number | null,
): Promise<unknown> {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const found = matchRoute(method.toUpperCase(), parts)
  if (!found) throw new MockHttpError(404, `mock 未实现该接口: ${method} ${pathname}`)
  return found.route.handler({ query, body, params: found.params, userId })
}
