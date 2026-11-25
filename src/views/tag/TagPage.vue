<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import ArticleCard from '@/components/common/ArticleCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TagChip from '@/components/common/TagChip.vue'
import { useArticleFeed } from '@/composables/useArticleList'
import { getTag, getTags } from '@/api/tag'
import { withAlpha } from '@/utils/color'
import type { ArticleSort, Tag } from '@/types'

const route = useRoute()
const tag = ref<Tag | null>(null)
const tags = ref<Tag[]>([])
const loadingTag = ref(true)
const sort = ref<ArticleSort>('latest')
const page = ref(1)

const tagId = computed(() => Number(route.params.id))
const feed = useArticleFeed(() => ({ tag_id: tagId.value, sort: sort.value }))

const headerStyle = computed(() => {
  const color = tag.value?.color || '#2b6cff'
  return {
    background: `linear-gradient(120deg, ${withAlpha(color, 0.18)}, ${withAlpha(color, 0.05)} 58%, #fff)`,
    borderColor: withAlpha(color, 0.18),
    // 标签色只做背景点缀，正文保持深色，避免浅色标签导致对比度不足
    color: '#1b2333',
  }
})

const asideTags = computed(() => tags.value.slice(0, 24))

async function loadTag(): Promise<void> {
  loadingTag.value = true
  try {
    tag.value = await getTag(tagId.value)
    document.title = `${tag.value.name} · 标签聚合 · AI 掘金头条`
  } catch {
    tag.value = null
  } finally {
    loadingTag.value = false
  }
}

function onChangeSort(next: ArticleSort): void {
  if (sort.value === next) return
  sort.value = next
  page.value = 1
  void feed.loadPage(1)
}

function onPage(next: number): void {
  page.value = next
  void feed.loadPage(next)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(tagId, async () => {
  page.value = 1
  await loadTag()
  await feed.loadPage(1)
})

onMounted(async () => {
  const [tagRes, allRes] = await Promise.allSettled([loadTag(), getTags()])
  if (allRes.status === 'fulfilled') tags.value = allRes.value
  void tagRes
  await feed.loadPage(1)
})
</script>

<template>
  <div class="page tag-page">
    <div class="container">
      <div class="page-grid">
        <div class="tag-main">
          <section class="tag-hero card" :style="headerStyle">
            <div class="tag-hero__left">
              <span class="tag-hero__eyebrow">技术标签</span>
              <h1 class="tag-hero__name">{{ tag?.name || '加载中…' }}</h1>
              <p class="tag-hero__desc">{{ tag?.description || '该标签下的全部文章' }}</p>
              <div class="tag-hero__meta">
                <span><strong>{{ tag?.article_count ?? 0 }}</strong> 篇文章</span>
                <span class="dot" />
                <span>持续更新中</span>
              </div>
            </div>
            <div class="tag-hero__cloud">
              <TagChip
                v-for="item in tags.slice(0, 8)"
                :key="item.id"
                :name="item.name"
                :color="item.color"
                :tag-id="item.id"
              />
            </div>
          </section>

          <section class="list-card card">
            <div class="list-head">
              <h2>标签下的文章</h2>
              <div class="sort-switch">
                <button
                  type="button"
                  class="sort-switch__btn"
                  :class="{ 'is-active': sort === 'latest' }"
                  @click="onChangeSort('latest')"
                >
                  最新
                </button>
                <button
                  type="button"
                  class="sort-switch__btn"
                  :class="{ 'is-active': sort === 'hot' }"
                  @click="onChangeSort('hot')"
                >
                  最热
                </button>
              </div>
            </div>

            <div v-if="feed.loading.value" class="skeleton">
              <div v-for="n in 5" :key="n" class="skeleton__row"><el-skeleton :rows="2" animated /></div>
            </div>
            <template v-else-if="feed.items.value.length">
              <ArticleCard v-for="item in feed.items.value" :key="item.id" :article="item" />
            </template>
            <EmptyState v-else icon="🏷" title="该标签下暂无文章" description="换个标签看看，或者回到首页浏览推荐内容。" />
          </section>

          <div v-if="feed.pages.value > 1" class="pager">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="feed.total.value"
              :page-size="10"
              :current-page="page"
              @current-change="onPage"
            />
          </div>
        </div>

        <aside class="tag-aside card">
          <h3>全部标签</h3>
          <div class="tag-aside__cloud">
            <TagChip
              v-for="item in asideTags"
              :key="item.id"
              :name="item.name"
              :color="item.color"
              :tag-id="item.id"
              :count="item.article_count"
            />
          </div>
          <RouterLink class="tag-aside__back" to="/articles">浏览全部文章 →</RouterLink>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-hero {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 26px 28px;
  border-color: transparent;

  &__left {
    min-width: 0;
  }

  &__eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    opacity: 0.72;
  }

  &__name {
    margin-top: 6px;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  &__desc {
    margin-top: 8px;
    font-size: 13.5px;
    color: var(--c-text-2);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
    font-size: 12.5px;
    color: var(--c-text-2);

    strong {
      font-size: 16px;
      font-weight: 800;
      color: var(--c-text);
    }
  }

  &__cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-width: 300px;
    justify-content: flex-end;
  }
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
}

.list-card {
  overflow: hidden;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--c-border);

  h2 {
    font-size: 15px;
    font-weight: 700;
  }
}

.sort-switch {
  display: flex;
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
    cursor: pointer;

    &.is-active {
      background: #fff;
      color: var(--c-primary);
      font-weight: 650;
      box-shadow: 0 2px 8px rgba(23, 38, 71, 0.1);
    }
  }
}

.skeleton {
  padding: 8px 20px;

  &__row {
    padding: 18px 0;
    border-bottom: 1px solid var(--c-border);
  }
}

.pager {
  display: flex;
  justify-content: center;
}

.tag-aside {
  position: sticky;
  top: calc(var(--header-h) + 20px);
  padding: 18px;

  h3 {
    font-size: 14px;
    font-weight: 700;
  }

  &__cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  &__back {
    display: inline-block;
    margin-top: 18px;
    font-size: 12.5px;
    color: var(--c-primary);
  }
}

@media (max-width: 960px) {
  .tag-aside {
    position: static;
  }

  .tag-hero__cloud {
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
