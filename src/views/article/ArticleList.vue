<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import CategoryTabs from '@/components/common/CategoryTabs.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useArticleFeed } from '@/composables/useArticleList'
import { getCategories, getTags } from '@/api/tag'
import type { ArticleSort, Category, Tag } from '@/types'

const route = useRoute()
const router = useRouter()

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const keywordInput = ref('')

const feed = useArticleFeed(() => ({
  keyword: typeof route.query.keyword === 'string' ? route.query.keyword : undefined,
  category: typeof route.query.category === 'string' ? route.query.category : undefined,
  tag_id: route.query.tag_id ? Number(route.query.tag_id) : undefined,
  sort: (route.query.sort as ArticleSort) || 'latest',
}))

const activeCategory = computed(() => (typeof route.query.category === 'string' ? route.query.category : '全部'))
const activeTag = computed(() => (route.query.tag_id ? Number(route.query.tag_id) : ''))
const sort = computed<ArticleSort>(() => (route.query.sort === 'hot' ? 'hot' : 'latest'))
const keyword = computed(() => (typeof route.query.keyword === 'string' ? route.query.keyword : ''))
const currentPage = computed(() => (route.query.page ? Number(route.query.page) : 1))
const tabs = computed(() => [{ name: '全部' }, ...categories.value.map((item) => ({ name: item.name }))])

function updateQuery(patch: Record<string, string | number | undefined>): void {
  const next = { ...route.query, ...patch }
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined || next[key] === '') delete next[key]
  })
  // 除翻页外的筛选条件变化都回到第 1 页
  if (!('page' in patch)) delete next.page
  router.push({ path: '/articles', query: next })
}

function onCategory(name: string): void {
  updateQuery({ category: name === '全部' ? undefined : name })
}

function onTagChange(value: number | ''): void {
  updateQuery({ tag_id: value || undefined })
}

function onSort(value: ArticleSort): void {
  updateQuery({ sort: value })
}

function onPage(page: number): void {
  updateQuery({ page })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onSearch(): void {
  updateQuery({ keyword: keywordInput.value.trim() || undefined })
}

watch(
  () => route.query,
  () => {
    keywordInput.value = keyword.value
    void feed.loadPage(currentPage.value)
  },
)

onMounted(async () => {
  keywordInput.value = keyword.value
  const [catRes, tagRes] = await Promise.allSettled([getCategories(), getTags()])
  if (catRes.status === 'fulfilled') categories.value = catRes.value
  if (tagRes.status === 'fulfilled') tags.value = tagRes.value
  await feed.loadPage(currentPage.value)
})
</script>

<template>
  <div class="page article-list">
    <div class="container">
      <div class="page-grid">
        <div class="list-col">
          <section class="filter-card card">
            <div class="filter-card__top">
              <div class="filter-card__search">
                <el-input
                  v-model="keywordInput"
                  placeholder="搜索标题、摘要或标签"
                  clearable
                  @keyup.enter="onSearch"
                  @clear="onSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                  <template #append>
                    <el-button @click="onSearch">搜索</el-button>
                  </template>
                </el-input>
              </div>

              <el-select
                :model-value="activeTag"
                placeholder="全部标签"
                clearable
                filterable
                class="tag-select"
                @change="onTagChange"
              >
                <el-option v-for="tag in tags" :key="tag.id" :label="`${tag.name}（${tag.article_count}）`" :value="tag.id" />
              </el-select>
            </div>

            <div class="filter-card__bottom">
              <CategoryTabs :tabs="tabs" :model-value="activeCategory" @update:model-value="onCategory" />
              <div class="sort-switch">
                <button
                  type="button"
                  class="sort-switch__btn"
                  :class="{ 'is-active': sort === 'latest' }"
                  @click="onSort('latest')"
                >
                  最新
                </button>
                <button
                  type="button"
                  class="sort-switch__btn"
                  :class="{ 'is-active': sort === 'hot' }"
                  @click="onSort('hot')"
                >
                  最热
                </button>
              </div>
            </div>
          </section>

          <div class="result-bar">
            <span>
              共 <strong>{{ feed.total.value }}</strong> 篇文章
              <template v-if="keyword">，匹配关键词「{{ keyword }}」</template>
            </span>
            <span v-if="activeTag" class="result-bar__chip">
              标签筛选
              <button type="button" @click="updateQuery({ tag_id: undefined })">×</button>
            </span>
          </div>

          <section class="list-card card">
            <div v-if="feed.loading.value" class="list-skeleton">
              <div v-for="n in 6" :key="n" class="list-skeleton__row">
                <el-skeleton :rows="2" animated />
              </div>
            </div>

            <template v-else-if="feed.items.value.length">
              <ArticleCard v-for="item in feed.items.value" :key="item.id" :article="item" />
            </template>

            <EmptyState
              v-else
              icon="🔍"
              title="没有找到匹配的文章"
              :description="feed.error.value || '试试更短的关键词，或者清空筛选条件重新查找。'"
              action-text="清空筛选"
              @action="router.push('/articles')"
            />
          </section>

          <div v-if="feed.pages.value > 1" class="pager">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="feed.total.value"
              :page-size="10"
              :current-page="currentPage"
              :pager-count="7"
              @current-change="onPage"
            />
          </div>
        </div>

        <AppSidebar />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.list-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-card {
  padding: 16px 16px 6px;

  &__top {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__search {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
    }

    :deep(.el-input-group__append) {
      background: #fff;
      box-shadow: none;
      border-left: 0;
    }
  }

  &__bottom {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    border-top: 1px dashed var(--c-border);
    padding-top: 2px;
  }
}

.tag-select {
  width: 200px;
  flex: none;

  :deep(.el-select__wrapper) {
    border-radius: 10px;
  }
}

.sort-switch {
  display: flex;
  flex: none;
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
    transition: all 0.18s ease;

    &.is-active {
      background: #fff;
      color: var(--c-primary);
      font-weight: 650;
      box-shadow: 0 2px 8px rgba(23, 38, 71, 0.1);
    }
  }
}

.result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  font-size: 13px;
  color: var(--c-text-3);

  strong {
    color: var(--c-primary);
    font-weight: 700;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--c-primary-weak);
    color: var(--c-primary);
    font-size: 12px;

    button {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    }
  }
}

.list-card {
  overflow: hidden;
}

.list-skeleton {
  padding: 8px 20px;

  &__row {
    padding: 18px 0;
    border-bottom: 1px solid var(--c-border);
  }
}

.pager {
  display: flex;
  justify-content: center;
  padding: 8px 0 12px;
}

@media (max-width: 760px) {
  .filter-card__top {
    flex-direction: column;
    align-items: stretch;
  }

  .tag-select {
    width: 100%;
  }

  .filter-card__bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding-bottom: 8px;
  }

  .sort-switch {
    align-self: flex-start;
  }
}
</style>
