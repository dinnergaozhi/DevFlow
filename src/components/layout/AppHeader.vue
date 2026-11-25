<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowDown, Clock, Star, SwitchButton, Search } from '@element-plus/icons-vue'
import AuthorAvatar from '@/components/common/AuthorAvatar.vue'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/feedback'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const keyword = ref('')
const navs = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/articles' },
  { label: '我的收藏', to: '/user/favorites' },
  { label: '浏览足迹', to: '/user/history' },
]

watch(
  () => route.query.keyword,
  (value) => {
    keyword.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)

function onSearch(): void {
  const value = keyword.value.trim()
  router.push({ path: '/articles', query: value ? { keyword: value } : {} })
}

function onLogout(): void {
  userStore.logout()
  toast.success('已退出登录')
  if (route.meta.requiresAuth) {
    router.push('/')
  }
}
</script>

<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <RouterLink class="brand" to="/">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#4d86ff" />
                <stop offset="100%" stop-color="#1e55d6" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#brandGradient)" />
            <path d="M11 9.5h4.1l2 6.1 2-6.1H23l-4.3 11.4h-3.4L11 9.5Z" fill="#fff" />
            <circle cx="23.5" cy="9" r="2.2" fill="#ffb27a" />
          </svg>
        </span>
        <span class="brand__text">
          <strong>AI 掘金头条</strong>
          <small>技术博客聚合平台</small>
        </span>
      </RouterLink>

      <nav class="nav">
        <RouterLink v-for="item in navs" :key="item.to" class="nav__link" :to="item.to">{{ item.label }}</RouterLink>
      </nav>

      <div class="header-search">
        <el-input
          v-model="keyword"
          placeholder="搜索文章、标签或作者"
          clearable
          @keyup.enter="onSearch"
          @clear="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="header-actions">
        <template v-if="userStore.isLogin">
          <el-dropdown trigger="click" placement="bottom-end">
            <button class="user-entry" type="button">
              <AuthorAvatar :name="userStore.displayName" :size="30" />
              <span class="user-entry__name text-ellipsis">{{ userStore.displayName }}</span>
              <el-icon class="user-entry__arrow"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/user/favorites')">
                  <el-icon><Star /></el-icon> 我的收藏
                </el-dropdown-item>
                <el-dropdown-item @click="router.push('/user/history')">
                  <el-icon><Clock /></el-icon> 浏览足迹
                </el-dropdown-item>
                <el-dropdown-item divided @click="onLogout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <RouterLink class="btn-text" to="/login">登录</RouterLink>
          <RouterLink class="btn-primary" to="/register">注册</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-h);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: saturate(180%) blur(16px);
  border-bottom: 1px solid var(--c-border);

  &__inner {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 22px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;

  &__mark {
    display: flex;
    filter: drop-shadow(0 6px 12px rgba(43, 108, 255, 0.28));
  }

  &__text {
    display: flex;
    flex-direction: column;
    line-height: 1.15;

    strong {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }

    small {
      margin-top: 2px;
      font-size: 11px;
      color: var(--c-text-3);
      letter-spacing: 0.6px;
    }
  }
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;

  &__link {
    position: relative;
    padding: 8px 12px;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 500;
    color: var(--c-text-2);
    transition: color 0.18s ease, background 0.18s ease;

    &:hover {
      color: var(--c-primary);
      background: var(--c-primary-weak);
    }

    &.router-link-exact-active {
      color: var(--c-primary);
      font-weight: 650;

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 1px;
        width: 16px;
        height: 3px;
        border-radius: 3px;
        transform: translateX(-50%);
        background: var(--c-primary);
      }
    }
  }
}

.header-search {
  flex: 1;
  max-width: 300px;
  margin-left: auto;

  :deep(.el-input__wrapper) {
    border-radius: 999px;
    background: #f3f5fa;
    box-shadow: none;
    padding: 2px 14px;
    transition: background 0.2s ease, box-shadow 0.2s ease;

    &.is-focus,
    &:hover {
      background: #fff;
      box-shadow: 0 0 0 1px var(--c-primary-line), 0 6px 18px rgba(43, 108, 255, 0.08);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.btn-text {
  padding: 7px 12px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-2);

  &:hover {
    color: var(--c-primary);
  }
}

.btn-primary {
  height: 34px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #4d86ff, #2b6cff);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(43, 108, 255, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(43, 108, 255, 0.3);
  }
}

.user-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 10px 0 4px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;

  &:hover {
    background: #f5f7fc;
    border-color: var(--c-border);
  }

  &__name {
    max-width: 96px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--c-text);
  }

  &__arrow {
    font-size: 12px;
    color: var(--c-text-3);
  }
}

@media (max-width: 960px) {
  .nav,
  .header-search {
    display: none;
  }

  .header-actions {
    margin-left: auto;
  }

  .brand__text small {
    display: none;
  }
}

@media (max-width: 480px) {
  .user-entry__name {
    display: none;
  }

  .app-header__inner {
    gap: 10px;
  }
}
</style>
