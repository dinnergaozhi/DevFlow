<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Clock, Document, HomeFilled, Star } from '@element-plus/icons-vue'

const route = useRoute()

const items = [
  { label: '首页', to: '/', icon: HomeFilled, match: (path: string) => path === '/' },
  { label: '文章', to: '/articles', icon: Document, match: (path: string) => path.startsWith('/articles') || path.startsWith('/article/') },
  { label: '收藏', to: '/user/favorites', icon: Star, match: (path: string) => path === '/user/favorites' },
  { label: '足迹', to: '/user/history', icon: Clock, match: (path: string) => path === '/user/history' },
]
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'is-active': item.match(route.path) }"
    >
      <el-icon :size="20"><component :is="item.icon" /></el-icon>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  display: none;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--c-border);

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 0;
    border-radius: 10px;
    font-size: 11px;
    color: var(--c-text-3);
    transition: color 0.16s ease;

    &.is-active {
      color: var(--c-primary);
      font-weight: 600;
    }
  }
}

@media (max-width: 760px) {
  .bottom-nav {
    display: flex;
  }
}
</style>
