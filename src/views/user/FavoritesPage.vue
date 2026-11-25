<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Delete, Star } from '@element-plus/icons-vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getFavorites, removeFavorite } from '@/api/favorite'
import { formatRelativeTime } from '@/utils/format'
import { confirmAction, toast } from '@/utils/feedback'
import type { FavoriteItem } from '@/types'

const items = ref<FavoriteItem[]>([])
const loading = ref(true)
const removing = ref<number | null>(null)
const keyword = ref('')

const filtered = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return items.value
  return items.value.filter(
    (item) =>
      item.article.title.toLowerCase().includes(value) ||
      item.article.summary.toLowerCase().includes(value) ||
      item.article.tag_name.toLowerCase().includes(value),
  )
})

async function load(): Promise<void> {
  loading.value = true
  try {
    items.value = await getFavorites()
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    loading.value = false
  }
}

async function onRemove(item: FavoriteItem): Promise<void> {
  const ok = await confirmAction(`确定要取消收藏《${item.article.title}》吗？`, '取消收藏')
  if (!ok) return
  removing.value = item.article_id
  try {
    await removeFavorite(item.article_id)
    items.value = items.value.filter((fav) => fav.article_id !== item.article_id)
    toast.success('已取消收藏')
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    removing.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="page favorites">
    <div class="container">
      <section class="head-card card">
        <div>
          <p class="head-card__eyebrow">个人中心</p>
          <h1 class="head-card__title">我的收藏</h1>
          <p class="head-card__desc">把想细读的文章存起来，按收藏时间倒序展示。</p>
        </div>
        <div class="head-card__stats">
          <div class="stat">
            <strong>{{ items.length }}</strong>
            <span>已收藏</span>
          </div>
          <div class="stat">
            <strong>{{ items.filter((i) => i.article.category === '前端').length }}</strong>
            <span>前端相关</span>
          </div>
          <div class="stat">
            <strong>{{ items.filter((i) => i.article.category === '后端').length }}</strong>
            <span>后端相关</span>
          </div>
        </div>
      </section>

      <div class="toolbar">
        <el-input v-model="keyword" placeholder="在收藏中搜索" clearable class="toolbar__search" />
        <RouterLink class="toolbar__link" to="/articles">去发现更多文章 →</RouterLink>
      </div>

      <section class="list-card card">
        <div v-if="loading" class="skeleton">
          <div v-for="n in 4" :key="n" class="skeleton__row"><el-skeleton :rows="2" animated /></div>
        </div>

        <template v-else-if="filtered.length">
          <div v-for="item in filtered" :key="item.article_id" class="fav-item">
            <ArticleCard :article="item.article" variant="list" :show-thumb="false" />
            <div class="fav-item__side">
              <span class="fav-item__time">收藏于 {{ formatRelativeTime(item.created_at) }}</span>
              <button
                type="button"
                class="fav-item__btn"
                :disabled="removing === item.article_id"
                @click="onRemove(item)"
              >
                <el-icon><Delete /></el-icon>
                取消收藏
              </button>
            </div>
          </div>
        </template>

        <EmptyState
          v-else-if="keyword"
          icon="🔍"
          title="没有匹配的收藏"
          description="换个关键词试试。"
          action-text="清空搜索"
          @action="keyword = ''"
        />
        <EmptyState
          v-else
          icon="⭐"
          title="收藏夹还是空的"
          description="在文章详情页点一下「收藏」，这里就会出现你留存的文章。"
          action-text="去逛逛首页"
          @action="$router.push('/')"
        />
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.head-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 28px;
  background: linear-gradient(135deg, #f6f9ff, #fff 60%);

  &__eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: var(--c-primary);
    text-transform: uppercase;
  }

  &__title {
    margin-top: 6px;
    font-size: 26px;
    font-weight: 800;
  }

  &__desc {
    margin-top: 8px;
    font-size: 13px;
    color: var(--c-text-3);
  }

  &__stats {
    display: flex;
    gap: 28px;
  }
}

.stat {
  display: flex;
  flex-direction: column;

  strong {
    font-size: 22px;
    font-weight: 800;
    color: var(--c-text);
  }

  span {
    font-size: 12px;
    color: var(--c-text-3);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 18px 0 12px;

  &__search {
    max-width: 300px;
  }

  &__link {
    font-size: 12.5px;
    color: var(--c-primary);
  }
}

.list-card {
  overflow: hidden;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-right: 20px;
  border-bottom: 1px solid var(--c-border);

  &:last-child {
    border-bottom: 0;
  }

  :deep(.article-card) {
    flex: 1;
    border-top: 0 !important;
  }

  &:last-child :deep(.article-card) {
    border-bottom: 0;
  }

  &__side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex: none;
  }

  &__time {
    font-size: 11.5px;
    color: var(--c-text-3);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--c-border);
    border-radius: 999px;
    background: #fff;
    color: var(--c-text-2);
    font-size: 12.5px;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      border-color: #ffd2c4;
      background: var(--c-accent-weak);
      color: var(--c-accent);
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

@media (max-width: 760px) {
  .fav-item {
    flex-direction: column;
    align-items: stretch;
    padding-right: 0;

    &__side {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px 14px;
    }
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;

    &__search {
      max-width: none;
    }
  }
}
</style>
