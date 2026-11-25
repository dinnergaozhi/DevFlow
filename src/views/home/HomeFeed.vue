<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import CategoryTabs from '@/components/common/CategoryTabs.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import TagChip from '@/components/common/TagChip.vue'
import { useArticleStore } from '@/stores/article'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { getCategories, getSiteStats, getTags } from '@/api/tag'
import { formatCount } from '@/utils/format'
import type { ArticleSort, Category, SiteStats, Tag } from '@/types'

const store = useArticleStore()
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const stats = ref<SiteStats | null>(null)
const sentinel = ref<HTMLElement | null>(null)

const tabs = computed(() => [{ name: '推荐' }, ...categories.value.map((item) => ({ name: item.name }))])
const canLoad = computed(() => !store.loading && !store.finished)
const sorts: { label: string; value: ArticleSort }[] = [
  { label: '最新', value: 'latest' },
  { label: '最热', value: 'hot' },
]

useInfiniteScroll(
  sentinel,
  () => {
    if (canLoad.value) void store.load()
  },
  canLoad,
)

function scrollFeedTop(): void {
  const el = document.querySelector('.feed-card')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 76
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function onCategory(name: string): void {
  if (store.setCategory(name)) {
    store.reset()
    void store.load(true)
    scrollFeedTop()
  }
}

function onSort(value: ArticleSort): void {
  if (store.setSort(value)) {
    store.reset()
    void store.load(true)
    scrollFeedTop()
  }
}

onMounted(async () => {
  const [catRes, tagRes, statRes] = await Promise.allSettled([
    getCategories(),
    getTags(6),
    getSiteStats(),
  ])
  if (catRes.status === 'fulfilled') categories.value = catRes.value
  if (tagRes.status === 'fulfilled') tags.value = tagRes.value
  if (statRes.status === 'fulfilled') stats.value = statRes.value

  if (store.list.length === 0) await store.load(true)
})
</script>

<template>
  <div class="page home">
    <div class="container">
      <!-- 顶部编辑精选 · 承接“今日头条”的信息流气质 -->
      <section class="hero card">
        <div class="hero__main">
          <p class="hero__eyebrow">
            <span class="pulse" />
            今日精选 · 每天 08:00 更新
          </p>
          <h1 class="hero__title">今天，读点硬核的。</h1>
          <p class="hero__desc">
            从 {{ stats?.tags ?? 69 }} 个技术标签里挑出最值得读的工程实践，覆盖后端、前端、数据库、云原生与
            AI 大模型。
          </p>
          <div class="hero__tags">
            <TagChip
              v-for="tag in tags"
              :key="tag.id"
              :name="tag.name"
              :color="tag.color"
              :tag-id="tag.id"
              size="md"
            />
            <RouterLink class="hero__all" to="/articles">
              全部文章
              <el-icon><ArrowRight /></el-icon>
            </RouterLink>
          </div>
        </div>

        <div class="hero__stats">
          <div class="hero-stat">
            <span class="hero-stat__num">{{ stats ? formatCount(stats.articles) : '—' }}</span>
            <span class="hero-stat__label">篇技术文章</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat__num">{{ stats ? stats.authors : '—' }}</span>
            <span class="hero-stat__label">位活跃作者</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat__num">{{ stats ? formatCount(stats.views) : '—' }}</span>
            <span class="hero-stat__label">次阅读</span>
          </div>
        </div>
      </section>

      <div class="page-grid">
        <div class="feed-col">
          <div class="feed-tabs card">
            <CategoryTabs :tabs="tabs" :model-value="store.category" @update:model-value="onCategory" />
            <div class="sort-switch" role="group" aria-label="排序方式">
              <button
                v-for="item in sorts"
                :key="item.value"
                type="button"
                class="sort-switch__btn"
                :class="{ 'is-active': store.sort === item.value }"
                @click="onSort(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <section class="feed-card card">
            <div v-if="store.loading && store.list.length === 0" class="feed-skeleton">
              <div v-for="n in 5" :key="n" class="feed-skeleton__row">
                <el-skeleton :rows="2" animated />
              </div>
            </div>

            <template v-else-if="store.list.length">
              <ArticleCard v-for="item in store.list" :key="item.id" :article="item" />
            </template>

            <EmptyState
              v-else
              title="这个栏目还没有文章"
              description="换个分类看看，或者去文章列表按热度找找灵感。"
              action-text="去文章列表"
              @action="$router.push('/articles')"
            />

            <div ref="sentinel" class="feed-sentinel">
              <span v-if="store.loading">正在加载更多…</span>
              <span v-else-if="store.finished && store.list.length">已经读完 {{ store.total }} 篇啦 · 换个分类继续</span>
              <button v-else-if="store.list.length" type="button" class="load-more" @click="store.load()">
                加载更多
              </button>
            </div>
          </section>
        </div>

        <AppSidebar />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home {
  padding-top: 20px;
}

.hero {
  position: relative;
  display: flex;
  gap: 28px;
  align-items: center;
  justify-content: space-between;
  padding: 26px 30px;
  margin-bottom: 20px;
  overflow: hidden;
  background: linear-gradient(118deg, #1c3f9e 0%, #2b6cff 46%, #4d86ff 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 18px 40px rgba(31, 84, 220, 0.22);

  &::before {
    content: '';
    position: absolute;
    width: 320px;
    height: 320px;
    right: -60px;
    top: -140px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
  }

  &::after {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    left: 42%;
    bottom: -160px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }

  &__main {
    position: relative;
    z-index: 1;
    max-width: 620px;
  }

  &__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  &__title {
    margin-top: 14px;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 0.5px;
    line-height: 1.25;
  }

  &__desc {
    margin-top: 10px;
    font-size: 13.5px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.82);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 18px;

    :deep(.tag-chip) {
      background: rgba(255, 255, 255, 0.16) !important;
      color: #fff !important;
      backdrop-filter: blur(4px);

      &:hover {
        background: rgba(255, 255, 255, 0.26) !important;
      }
    }
  }

  &__all {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: 4px;
    font-size: 12.5px;
    font-weight: 600;
    color: #fff;
    opacity: 0.86;

    &:hover {
      opacity: 1;
    }
  }

  &__stats {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 26px;
    padding-left: 26px;
    border-left: 1px solid rgba(255, 255, 255, 0.22);
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__num {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.4px;
  }

  &__label {
    font-size: 11.5px;
    color: rgba(255, 255, 255, 0.72);
    white-space: nowrap;
  }
}

.pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7dfcc0;
  box-shadow: 0 0 0 0 rgba(125, 252, 192, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 8px rgba(125, 252, 192, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(125, 252, 192, 0);
  }
}

.feed-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed-tabs {
  position: sticky;
  top: calc(var(--header-h) + 10px);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 2px 14px 0;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 18px rgba(23, 38, 71, 0.05);
}

.feed-card {
  overflow: hidden;
}

.sort-switch {
  display: flex;
  flex: none;
  margin-left: auto;
  padding: 3px;
  border-radius: 999px;
  background: #f3f5fa;

  &__btn {
    height: 28px;
    padding: 0 14px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--c-text-3);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s ease;

    &.is-active {
      background: #fff;
      color: var(--c-primary);
      font-weight: 650;
      box-shadow: 0 2px 8px rgba(23, 38, 71, 0.1);
    }
  }
}

.feed-skeleton {
  padding: 8px 20px;

  &__row {
    padding: 18px 0;
    border-bottom: 1px solid var(--c-border);

    &:last-child {
      border-bottom: 0;
    }
  }
}

.feed-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  padding: 18px;
  font-size: 13px;
  color: var(--c-text-3);
}

.load-more {
  height: 34px;
  padding: 0 20px;
  border: 1px solid var(--c-primary-line);
  border-radius: 999px;
  background: var(--c-primary-weak);
  color: var(--c-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e2ecff;
  }
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
    gap: 18px;

    &__title {
      font-size: 24px;
    }

    &__desc {
      font-size: 13px;
    }

    &__stats {
      padding-left: 0;
      padding-top: 16px;
      border-left: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      width: 100%;
      justify-content: space-between;
      gap: 12px;
    }
  }

  .feed-tabs {
    position: static;
  }
}
</style>
