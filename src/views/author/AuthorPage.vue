<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import AuthorAvatar from '@/components/common/AuthorAvatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useArticleFeed } from '@/composables/useArticleList'
import { getAuthor } from '@/api/tag'
import { formatCount, formatDate } from '@/utils/format'
import { toast } from '@/utils/feedback'
import type { Author } from '@/types'

const route = useRoute()
const author = ref<Author | null>(null)
const loading = ref(true)
const following = ref(false)
const page = ref(1)

const authorId = computed(() => Number(route.params.id))
const feed = useArticleFeed(() => ({ author_id: authorId.value, sort: 'latest' }))
const heat = computed(() => {
  if (!author.value) return 0
  return Math.min(100, Math.round((author.value.followers / 50000) * 100))
})

async function loadAuthor(): Promise<void> {
  loading.value = true
  try {
    author.value = await getAuthor(authorId.value)
    document.title = `${author.value.nickname} · 作者主页 · AI 掘金头条`
  } catch {
    author.value = null
  } finally {
    loading.value = false
  }
}

function onPage(next: number): void {
  page.value = next
  void feed.loadPage(next)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onFollow(): void {
  following.value = !following.value
  toast.success(following.value ? `已关注 ${author.value?.nickname ?? ''}` : '已取消关注')
}

watch(authorId, async () => {
  page.value = 1
  await loadAuthor()
  await feed.loadPage(1)
})

onMounted(async () => {
  await loadAuthor()
  await feed.loadPage(1)
})
</script>

<template>
  <div class="page author-page">
    <div class="container">
      <section class="author-hero card">
        <div class="author-hero__pattern" />
        <div class="author-hero__main">
          <AuthorAvatar :name="author?.nickname || '?'" :size="84" />
          <div class="author-hero__info">
            <div class="author-hero__name-row">
              <h1>{{ author?.nickname || '加载中…' }}</h1>
              <span v-if="author?.title" class="author-hero__title">{{ author.title }}</span>
            </div>
            <p class="author-hero__bio">{{ author?.bio || '这位作者还没有填写个人简介。' }}</p>
            <div class="author-hero__meta">
              <span v-if="author?.company">{{ author.company }}</span>
              <span class="divider" />
              <span>加入于 {{ formatDate(author?.created_at || '') }}</span>
            </div>
          </div>
        </div>

        <div class="author-hero__side">
          <div class="author-hero__stats">
            <div class="stat">
              <strong>{{ author?.article_count ?? 0 }}</strong>
              <span>篇文章</span>
            </div>
            <div class="stat">
              <strong>{{ formatCount(author?.followers ?? 0) }}</strong>
              <span>关注者</span>
            </div>
          </div>
          <div class="author-hero__heat">
            <div class="heat-bar"><i :style="{ width: `${heat}%` }" /></div>
            <small>影响力 {{ heat }} / 100</small>
          </div>
          <button type="button" class="follow-btn" :class="{ 'is-followed': following }" @click="onFollow">
            <el-icon v-if="!following"><Plus /></el-icon>
            {{ following ? '已关注' : '关注' }}
          </button>
        </div>
      </section>

      <section class="author-articles card">
        <div class="author-articles__head">
          <h2>TA 的文章</h2>
          <span>共 {{ feed.total.value }} 篇</span>
        </div>

        <div v-if="feed.loading.value" class="skeleton">
          <div v-for="n in 4" :key="n" class="skeleton__row"><el-skeleton :rows="2" animated /></div>
        </div>
        <template v-else-if="feed.items.value.length">
          <ArticleCard v-for="item in feed.items.value" :key="item.id" :article="item" />
        </template>
        <EmptyState v-else icon="✍️" title="还没有发布文章" description="这位作者正在憋大招，先去看看别人的分享吧。" />
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
  </div>
</template>

<style scoped lang="scss">
.author-hero {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 28px 30px;
  margin-bottom: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, #f7f9ff, #fff 55%);

  &__pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 88% -20%, rgba(43, 108, 255, 0.16), transparent 46%),
      radial-gradient(circle at 4% 120%, rgba(255, 106, 61, 0.1), transparent 40%);
    pointer-events: none;
  }

  &__main {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
  }

  &__info {
    min-width: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.4px;
    }
  }

  &__title {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--c-primary-weak);
    color: var(--c-primary-deep);
    font-size: 12px;
    font-weight: 600;
  }

  &__bio {
    margin-top: 8px;
    font-size: 13.5px;
    color: var(--c-text-2);
    max-width: 520px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--c-text-3);
  }

  &__side {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 26px;
  }

  &__stats {
    display: flex;
    gap: 24px;
  }

  &__heat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 130px;

    small {
      font-size: 11.5px;
      color: var(--c-text-3);
    }
  }
}

.stat {
  display: flex;
  flex-direction: column;

  strong {
    font-size: 20px;
    font-weight: 800;
  }

  span {
    font-size: 12px;
    color: var(--c-text-3);
  }
}

.heat-bar {
  height: 6px;
  border-radius: 999px;
  background: #eceff6;
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #7dfcc0, #2b6cff);
  }
}

.follow-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 38px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #4d86ff, #2b6cff);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(43, 108, 255, 0.25);

  &.is-followed {
    background: #f2f5fb;
    color: var(--c-text-3);
    box-shadow: none;
  }
}

.divider {
  width: 1px;
  height: 10px;
  background: var(--c-border-strong);
}

.author-articles {
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--c-border);

    h2 {
      font-size: 15px;
      font-weight: 700;
    }

    span {
      font-size: 12.5px;
      color: var(--c-text-3);
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
  margin-top: 18px;
}

@media (max-width: 860px) {
  .author-hero {
    padding: 22px;

    &__side {
      width: 100%;
      justify-content: space-between;
      gap: 14px;
    }
  }
}

@media (max-width: 560px) {
  .author-hero__main {
    flex-direction: column;
    align-items: flex-start;
  }

  .author-hero__side {
    flex-wrap: wrap;
  }
}
</style>
