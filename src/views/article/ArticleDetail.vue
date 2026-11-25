<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Link, Plus, Star, StarFilled } from '@element-plus/icons-vue'
import AuthorAvatar from '@/components/common/AuthorAvatar.vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TagChip from '@/components/common/TagChip.vue'
import { getArticleDetail, getRelatedArticles, reportView, toggleLike } from '@/api/article'
import { addFavorite, removeFavorite } from '@/api/favorite'
import { useUserStore } from '@/stores/user'
import { useArticleStore } from '@/stores/article'
import { attachHeadingIds, extractToc, renderMarkdown } from '@/utils/markdown'
import { formatCount, formatDateTime, formatRelativeTime, readingMinutes } from '@/utils/format'
import { markReported } from '@/utils/storage'
import { toast } from '@/utils/feedback'
import type { Article } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const articleStore = useArticleStore()

const article = ref<Article | null>(null)
const related = ref<Article[]>([])
const loading = ref(true)
const error = ref('')
const bodyEl = ref<HTMLElement | null>(null)
const progress = ref(0)
const activeHeading = ref('')
const busy = ref(false)
const following = ref(false)

const articleId = computed(() => Number(route.params.id))
const html = computed(() => (article.value?.content ? renderMarkdown(article.value.content) : ''))
const toc = computed(() => (article.value?.content ? extractToc(article.value.content) : []))
const authorName = computed(() => article.value?.author?.nickname || `作者 #${article.value?.author_id ?? ''}`)
const minutes = computed(() => (article.value?.content ? readingMinutes(article.value.content) : 1))

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const data = await getArticleDetail(articleId.value)
    article.value = data
    related.value = await getRelatedArticles(articleId.value, 5)
    // 浏览上报：sessionStorage 去重，避免来回切页刷量（方案 5.3）
    if (markReported(data.id)) {
      try {
        const { views } = await reportView(data.id)
        if (article.value) article.value.views = views
      } catch {
        /* 上报失败不影响阅读 */
      }
    }
    await nextTick()
    attachHeadingIds(bodyEl.value)
    onScroll()
  } catch (err) {
    error.value = (err as Error).message || '文章加载失败'
  } finally {
    loading.value = false
  }
}

function requireLogin(): boolean {
  if (userStore.isLogin) return true
  toast.warning('登录后才能使用该功能')
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return false
}

async function onLike(): Promise<void> {
  if (!requireLogin() || !article.value || busy.value) return
  busy.value = true
  try {
    const result = await toggleLike(article.value.id)
    article.value.liked = result.liked
    article.value.likes = result.likes
    articleStore.patch(article.value.id, { liked: result.liked, likes: result.likes })
    toast.success(result.liked ? '已点赞' : '已取消点赞')
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    busy.value = false
  }
}

async function onFavorite(): Promise<void> {
  if (!requireLogin() || !article.value || busy.value) return
  busy.value = true
  try {
    const result = article.value.favorited
      ? await removeFavorite(article.value.id)
      : await addFavorite(article.value.id)
    article.value.favorited = result.favorited
    article.value.favorites = Math.max(0, article.value.favorites + (result.favorited ? 1 : -1))
    toast.success(result.favorited ? '已加入收藏' : '已取消收藏')
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    busy.value = false
  }
}

async function onCopy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('链接已复制')
  } catch {
    toast.error('复制失败，请手动复制地址栏')
  }
}

function jumpTo(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  const top = target.getBoundingClientRect().top + window.scrollY - 88
  window.scrollTo({ top, behavior: 'smooth' })
}

function onScroll(): void {
  const height = document.documentElement.scrollHeight - window.innerHeight
  progress.value = height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0

  if (!bodyEl.value) return
  const headings = Array.from(bodyEl.value.querySelectorAll<HTMLElement>('h2, h3'))
  const offset = 140
  let current = ''
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= offset) current = heading.id
  }
  if (current) activeHeading.value = current
}

watch(articleId, () => {
  window.scrollTo({ top: 0 })
  void load()
})

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  void load()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="page detail-page">
    <div class="progress" :style="{ width: `${progress}%` }" />

    <div class="container">
      <div v-if="loading" class="detail-grid">
        <div class="card skeleton-card">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="h1" style="width: 70%; height: 28px" />
              <div style="margin-top: 16px; display: flex; gap: 12px">
                <el-skeleton-item variant="circle" style="width: 36px; height: 36px" />
                <el-skeleton-item variant="text" style="width: 40%" />
              </div>
              <el-skeleton-item v-for="n in 10" :key="n" variant="text" style="margin-top: 12px" />
            </template>
          </el-skeleton>
        </div>
      </div>

      <EmptyState
        v-else-if="error || !article"
        icon="🛠"
        title="文章走丢了"
        :description="error || '这篇内容可能已被作者删除。'"
      >
        <div class="error-actions">
          <el-button type="primary" @click="load">重新加载</el-button>
          <el-button @click="router.push('/articles')">返回列表</el-button>
        </div>
      </EmptyState>

      <div v-else class="detail-grid">
        <article class="article card">
          <nav class="crumb">
            <RouterLink to="/">首页</RouterLink>
            <span>/</span>
            <RouterLink :to="`/articles?category=${encodeURIComponent(article.category)}`">
              {{ article.category }}
            </RouterLink>
            <span>/</span>
            <span class="crumb__current text-ellipsis">{{ article.title }}</span>
          </nav>

          <header class="article__head">
            <TagChip
              :name="article.tag_name"
              :color="article.tag?.color || '#2b6cff'"
              :tag-id="article.tag_id"
              size="md"
            />
            <h1 class="article__title">{{ article.title }}</h1>
            <p class="article__summary">{{ article.summary }}</p>

            <div class="article__meta">
              <RouterLink class="author" :to="`/author/${article.author_id}`">
                <AuthorAvatar :name="authorName" :size="40" />
                <span class="author__info">
                  <strong>{{ authorName }}</strong>
                  <small>
                    {{ article.author?.company || article.author?.title || '独立作者' }}
                  </small>
                </span>
              </RouterLink>

              <div class="article__stats">
                <span>{{ formatDateTime(article.published_at) }}</span>
                <span class="divider" />
                <span>{{ minutes }} 分钟读完</span>
                <span class="divider" />
                <span>{{ formatCount(article.views) }} 阅读</span>
              </div>
            </div>
          </header>

          <div class="article__toolbar">
            <button
              type="button"
              class="action"
              :class="{ 'is-on': article.liked }"
              :disabled="busy"
              @click="onLike"
            >
              <svg class="thumb-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path
                  d="M2 10.5h3.2V21H2zM6.6 21V10.2l4.1-7.4a1.6 1.6 0 0 1 2.9.9v4.1h4.5a2 2 0 0 1 2 2.3l-.9 6.4a2.6 2.6 0 0 1-2.6 2.2z"
                  fill="currentColor"
                />
              </svg>
              赞 {{ formatCount(article.likes) }}
            </button>
            <button
              type="button"
              class="action"
              :class="{ 'is-on': article.favorited }"
              :disabled="busy"
              @click="onFavorite"
            >
              <el-icon>
                <StarFilled v-if="article.favorited" />
                <Star v-else />
              </el-icon>
              {{ article.favorited ? '已收藏' : '收藏' }}
            </button>
            <button type="button" class="action" @click="onCopy">
              <el-icon><Link /></el-icon>
              复制链接
            </button>
            <span class="article__toolbar-spacer" />
            <span class="article__date">更新于 {{ formatRelativeTime(article.published_at) }}</span>
          </div>

          <div ref="bodyEl" class="article__body markdown-body" v-html="html" />

          <footer class="article__footer">
            <div class="article__tags">
              <span class="label">所属标签</span>
              <TagChip
                :name="article.tag_name"
                :color="article.tag?.color || '#2b6cff'"
                :tag-id="article.tag_id"
                size="md"
              />
              <span class="label" style="margin-left: 8px">分类</span>
              <RouterLink class="cat-link" :to="`/articles?category=${encodeURIComponent(article.category)}`">
                {{ article.category }}
              </RouterLink>
            </div>
            <p class="article__notice">本文由作者授权发布，转载请注明出处。</p>
          </footer>
        </article>

        <aside class="detail-aside">
          <section v-if="toc.length" class="card toc">
            <h3 class="toc__title">本文目录</h3>
            <ol class="toc__list">
              <li
                v-for="item in toc"
                :key="item.id"
                :class="['toc__item', `is-h${item.level}`, { 'is-active': activeHeading === item.id }]"
              >
                <button type="button" @click="jumpTo(item.id)">{{ item.text }}</button>
              </li>
            </ol>
          </section>

          <section class="card author-card">
            <div class="author-card__head">
              <AuthorAvatar :name="authorName" :size="52" />
              <div class="author-card__info">
                <strong class="text-ellipsis">{{ authorName }}</strong>
                <small class="text-ellipsis">
                  {{ article.author?.title || '作者' }}
                  <template v-if="article.author?.company"> · {{ article.author.company }}</template>
                </small>
              </div>
            </div>
            <p class="author-card__bio">{{ article.author?.bio || '这个人很懒，什么都没留下。' }}</p>
            <div class="author-card__stats">
              <span><strong>{{ article.author?.article_count ?? '—' }}</strong> 篇文章</span>
              <span><strong>{{ formatCount(article.author?.followers ?? 0) }}</strong> 关注者</span>
            </div>
            <div class="author-card__actions">
              <button
                type="button"
                class="follow"
                :class="{ 'is-followed': following }"
                @click="following = !following; toast.success(following ? '已关注该作者' : '已取消关注')"
              >
                <el-icon v-if="!following"><Plus /></el-icon>
                {{ following ? '已关注' : '关注作者' }}
              </button>
              <RouterLink class="profile-link" :to="`/author/${article.author_id}`">主页</RouterLink>
            </div>
          </section>

          <section v-if="related.length" class="card related">
            <h3 class="related__title">相关文章</h3>
            <ArticleCard v-for="item in related" :key="item.id" :article="item" variant="compact" :show-thumb="false" />
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  height: 3px;
  background: linear-gradient(90deg, #2b6cff, #7dfcc0);
  transition: width 0.1s linear;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
  padding-top: 18px;
}

.article {
  padding: 30px 40px 34px;
  overflow: hidden;

  &__head {
    margin-top: 18px;
  }

  &__title {
    margin-top: 14px;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: 0.2px;
  }

  &__summary {
    margin-top: 12px;
    font-size: 14.5px;
    line-height: 1.75;
    color: var(--c-text-2);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--c-border);
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
    color: var(--c-text-3);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0 6px;
    padding: 12px 0;
  }

  &__toolbar-spacer {
    flex: 1;
  }

  &__date {
    font-size: 12px;
    color: var(--c-text-3);
  }

  &__body {
    margin-top: 18px;
  }

  &__footer {
    margin-top: 34px;
    padding-top: 20px;
    border-top: 1px dashed var(--c-border-strong);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__notice {
    margin-top: 14px;
    font-size: 12px;
    color: var(--c-text-3);
  }
}

.crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--c-text-3);

  a:hover {
    color: var(--c-primary);
  }

  &__current {
    max-width: 320px;
    color: var(--c-text-2);
  }
}

.author {
  display: flex;
  align-items: center;
  gap: 10px;

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.4;

    strong {
      font-size: 14px;
      font-weight: 650;
      color: var(--c-text);
    }

    small {
      font-size: 12px;
      color: var(--c-text-3);
    }
  }
}

.divider {
  width: 1px;
  height: 11px;
  background: var(--c-border-strong);
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: #fff;
  color: var(--c-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;

  .thumb-icon {
    transition: transform 0.2s ease;
  }

  &:hover .thumb-icon {
    transform: translateY(-1px) rotate(-8deg);
  }

  &:hover {
    border-color: var(--c-primary-line);
    color: var(--c-primary);
    background: var(--c-primary-weak);
  }

  &.is-on {
    border-color: var(--c-primary-line);
    background: var(--c-primary-weak);
    color: var(--c-primary);
    font-weight: 600;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.label {
  font-size: 12px;
  color: var(--c-text-3);
}

.cat-link {
  font-size: 12.5px;
  color: var(--c-primary);
}

.detail-aside {
  position: sticky;
  top: calc(var(--header-h) + 18px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toc {
  padding: 16px 16px 12px;

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: var(--c-text);
  }

  &__list {
    margin-top: 8px;
    max-height: 46vh;
    overflow-y: auto;
  }

  &__item {
    border-left: 2px solid transparent;
    transition: border-color 0.16s ease;

    &.is-h3 {
      padding-left: 10px;
    }

    button {
      width: 100%;
      padding: 5px 10px;
      border: 0;
      background: transparent;
      color: var(--c-text-2);
      font-size: 12.5px;
      line-height: 1.5;
      text-align: left;
      cursor: pointer;
      border-radius: 0 6px 6px 0;

      &:hover {
        color: var(--c-primary);
        background: var(--c-primary-weak);
      }
    }

    &.is-active {
      border-left-color: var(--c-primary);

      button {
        color: var(--c-primary);
        font-weight: 600;
      }
    }
  }
}

.author-card {
  padding: 18px;

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.5;

    strong {
      font-size: 14.5px;
      font-weight: 700;
    }

    small {
      font-size: 12px;
      color: var(--c-text-3);
    }
  }

  &__bio {
    margin-top: 12px;
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--c-text-2);
  }

  &__stats {
    display: flex;
    gap: 18px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--c-text-3);

    strong {
      color: var(--c-text);
      font-weight: 700;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
}

.follow {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #4d86ff, #2b6cff);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(43, 108, 255, 0.22);

  &.is-followed {
    background: #f2f5fb;
    color: var(--c-text-3);
    box-shadow: none;
  }
}

.profile-link {
  font-size: 12.5px;
  color: var(--c-text-3);

  &:hover {
    color: var(--c-primary);
  }
}

.related {
  padding: 16px 16px 10px;

  &__title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  :deep(.article-card) {
    padding-left: 0;
    padding-right: 0;
  }
}

.skeleton-card {
  padding: 32px 40px;
  grid-column: 1 / -1;
}

.error-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

@media (max-width: 1080px) {
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail-aside {
    position: static;
  }
}

@media (max-width: 720px) {
  .article {
    padding: 20px 18px 24px;

    &__title {
      font-size: 23px;
    }

    &__meta {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
