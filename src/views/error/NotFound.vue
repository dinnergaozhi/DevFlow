<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page not-found">
    <div class="container">
      <div class="panel card">
        <p class="panel__code">404</p>
        <h1 class="panel__title">这条信息流断流了</h1>
        <p class="panel__desc">你访问的页面可能已被删除、改名，或者从来没有存在过。</p>
        <div class="panel__actions">
          <RouterLink class="btn btn--primary" to="/">回到首页</RouterLink>
          <RouterLink class="btn" to="/articles">浏览全部文章</RouterLink>
        </div>
        <div class="panel__tips">
          <span>你可能想找：</span>
          <RouterLink to="/articles?sort=hot">热门文章</RouterLink>
          <RouterLink to="/tag/1">Python 标签</RouterLink>
          <RouterLink to="/user/favorites">我的收藏</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  padding: 60px 0 100px;
}

.panel {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  padding: 56px 40px 44px;
  text-align: center;
  overflow: hidden;
  background: radial-gradient(120% 100% at 50% 0%, #f0f5ff, #fff 62%);

  &__code {
    font-size: 96px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #2b6cff, #8fb4ff 60%, #ffb27a);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__title {
    margin-top: 14px;
    font-size: 24px;
    font-weight: 800;
  }

  &__desc {
    margin-top: 10px;
    font-size: 13.5px;
    color: var(--c-text-3);
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 26px;
  }

  &__tips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px dashed var(--c-border);
    font-size: 12.5px;
    color: var(--c-text-3);

    a {
      color: var(--c-primary);
    }
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 22px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: #fff;
  color: var(--c-text-2);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.18s ease;

  &--primary {
    border-color: transparent;
    background: linear-gradient(135deg, #4d86ff, #2b6cff);
    color: #fff;
    box-shadow: 0 10px 22px rgba(43, 108, 255, 0.24);
  }

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
