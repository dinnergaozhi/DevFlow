<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Delete, Clock } from '@element-plus/icons-vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { clearHistory, getHistory } from '@/api/favorite'
import { formatDate } from '@/utils/format'
import { confirmAction, toast } from '@/utils/feedback'
import type { HistoryItem } from '@/types'

interface Group {
  label: string
  date: string
  items: HistoryItem[]
}

const items = ref<HistoryItem[]>([])
const loading = ref(true)
const clearing = ref(false)

const today = localDate(new Date())

function localDate(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dayLabel(date: string): string {
  if (date === today) return '今天'
  const yesterday = localDate(new Date(Date.now() - 86400000))
  if (date === yesterday) return '昨天'
  return formatDate(date)
}

const groups = computed<Group[]>(() => {
  const map = new Map<string, HistoryItem[]>()
  for (const item of items.value) {
    const date = (item.viewed_at || '').slice(0, 10)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(item)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, list]) => ({ date, label: dayLabel(date), items: list }))
})

function timeOf(value: string): string {
  return value.slice(11, 16)
}

async function load(): Promise<void> {
  loading.value = true
  try {
    items.value = await getHistory()
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    loading.value = false
  }
}

async function onClear(): Promise<void> {
  const ok = await confirmAction('清空后浏览足迹将无法恢复，确定继续吗？', '清空足迹', '清空')
  if (!ok) return
  clearing.value = true
  try {
    await clearHistory()
    items.value = []
    toast.success('浏览足迹已清空')
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    clearing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page history">
    <div class="container">
      <section class="head-card card">
        <div>
          <p class="head-card__eyebrow">个人中心</p>
          <h1 class="head-card__title">浏览足迹</h1>
          <p class="head-card__desc">按天倒序展示你最近读过的文章，最多保留最近 200 条。</p>
        </div>
        <div class="head-card__actions">
          <div class="stat">
            <strong>{{ items.length }}</strong>
            <span>条浏览记录</span>
          </div>
          <el-button :icon="Delete" :loading="clearing" :disabled="!items.length" @click="onClear">
            清空足迹
          </el-button>
        </div>
      </section>

      <div v-if="loading" class="card loading-card">
        <div v-for="n in 4" :key="n" class="skeleton-row"><el-skeleton :rows="2" animated /></div>
      </div>

      <template v-else-if="groups.length">
        <section v-for="group in groups" :key="group.date" class="day card">
          <header class="day__head">
            <h2>
              <el-icon><Clock /></el-icon>
              {{ group.label }}
            </h2>
            <span>{{ group.items.length }} 篇 · {{ group.date }}</span>
          </header>

          <div v-for="item in group.items" :key="item.id" class="history-item">
            <span class="history-item__time">{{ timeOf(item.viewed_at) }}</span>
            <div class="history-item__body">
              <ArticleCard :article="item.article" variant="compact" :show-thumb="false" />
            </div>
          </div>
        </section>
      </template>

      <EmptyState
        v-else
        icon="👣"
        title="还没有浏览记录"
        description="读过的文章会自动记录在这里，方便你随时找回。"
        action-text="去读一篇"
        @action="$router.push('/')"
      />

      <div class="back-row">
        <RouterLink to="/user/favorites">查看我的收藏 →</RouterLink>
      </div>
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
  background: linear-gradient(135deg, #fff7f3, #fff 55%);

  &__eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: var(--c-accent);
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

  &__actions {
    display: flex;
    align-items: center;
    gap: 22px;
  }
}

.stat {
  display: flex;
  flex-direction: column;

  strong {
    font-size: 22px;
    font-weight: 800;
  }

  span {
    font-size: 12px;
    color: var(--c-text-3);
  }
}

.day {
  margin-top: 16px;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--c-border);
    background: #fbfcff;

    h2 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 700;

      .el-icon {
        color: var(--c-accent);
      }
    }

    span {
      font-size: 12px;
      color: var(--c-text-3);
    }
  }
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 8px 20px;

  & + & {
    border-top: 1px dashed var(--c-border);
  }

  &__time {
    flex: none;
    width: 42px;
    padding-top: 14px;
    font-size: 12px;
    font-weight: 600;
    color: var(--c-text-3);
    font-variant-numeric: tabular-nums;
  }

  &__body {
    flex: 1;
    min-width: 0;

    :deep(.article-card) {
      padding: 8px 0;
    }
  }
}

.loading-card {
  margin-top: 16px;
  padding: 8px 20px;
}

.skeleton-row {
  padding: 18px 0;
  border-bottom: 1px solid var(--c-border);

  &:last-child {
    border-bottom: 0;
  }
}

.back-row {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;

  a {
    color: var(--c-primary);
  }
}

@media (max-width: 620px) {
  .head-card__actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
