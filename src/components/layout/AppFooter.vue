<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getSiteStats } from '@/api/tag'
import { formatCount } from '@/utils/format'
import type { SiteStats } from '@/types'

const stats = ref<SiteStats | null>(null)

onMounted(async () => {
  try {
    stats.value = await getSiteStats()
  } catch {
    stats.value = null
  }
})
</script>

<template>
  <footer class="app-footer">
    <div class="container app-footer__inner">
      <div class="app-footer__brand">
        <strong>AI 掘金头条</strong>
        <p>技术博客聚合阅读端 · Vue 3 + Vite + TypeScript</p>
        <p class="muted">后端：FastAPI · 异步 SQLAlchemy · MySQL · Redis</p>
      </div>

      <div class="app-footer__stats">
        <div class="stat">
          <span class="stat__num">{{ stats ? formatCount(stats.articles) : '—' }}</span>
          <span class="stat__label">篇文章</span>
        </div>
        <div class="stat">
          <span class="stat__num">{{ stats ? stats.tags : '—' }}</span>
          <span class="stat__label">个技术标签</span>
        </div>
        <div class="stat">
          <span class="stat__num">{{ stats ? stats.authors : '—' }}</span>
          <span class="stat__label">位作者</span>
        </div>
        <div class="stat">
          <span class="stat__num">{{ stats ? formatCount(stats.views) : '—' }}</span>
          <span class="stat__label">次阅读</span>
        </div>
      </div>

      <div class="app-footer__links">
        <RouterLink to="/articles">文章列表</RouterLink>
        <RouterLink to="/user/favorites">我的收藏</RouterLink>
        <RouterLink to="/user/history">浏览足迹</RouterLink>
        <span>© {{ new Date().getFullYear() }} DevFlow</span>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  margin-top: 40px;
  padding: 40px 0 48px;
  background: #fff;
  border-top: 1px solid var(--c-border);

  &__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
  }

  &__brand {
    strong {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }

    p {
      margin-top: 6px;
      font-size: 12.5px;
      color: var(--c-text-3);
    }

    .muted {
      color: #a6aebf;
    }
  }

  &__stats {
    display: flex;
    gap: 34px;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 12.5px;
    color: var(--c-text-3);

    a:hover {
      color: var(--c-primary);
    }
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__num {
    font-size: 18px;
    font-weight: 750;
    color: var(--c-text);
    letter-spacing: 0.3px;
  }

  &__label {
    font-size: 12px;
    color: var(--c-text-3);
  }
}

@media (max-width: 760px) {
  .app-footer {
    padding-bottom: 88px;

    &__stats {
      gap: 22px;
    }
  }
}
</style>
