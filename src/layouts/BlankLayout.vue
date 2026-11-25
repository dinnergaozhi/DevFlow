<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="blank-shell">
    <div class="blank-shell__blob blank-shell__blob--a" />
    <div class="blank-shell__blob blank-shell__blob--b" />

    <header class="blank-shell__header container">
      <RouterLink class="brand" to="/">
        <span class="brand__mark">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="brandGradientBlank" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#4d86ff" />
                <stop offset="100%" stop-color="#1e55d6" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#brandGradientBlank)" />
            <path d="M11 9.5h4.1l2 6.1 2-6.1H23l-4.3 11.4h-3.4L11 9.5Z" fill="#fff" />
            <circle cx="23.5" cy="9" r="2.2" fill="#ffb27a" />
          </svg>
        </span>
        <strong>AI 掘金头条</strong>
      </RouterLink>
      <RouterLink class="blank-shell__back" to="/">返回首页</RouterLink>
    </header>

    <main class="blank-shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.blank-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  background: radial-gradient(120% 90% at 12% 0%, #eef4ff 0%, #f6f8fd 46%, #f4f6fb 100%);

  &__header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-h);
  }

  &__back {
    font-size: 13px;
    color: var(--c-text-3);
    transition: color 0.18s ease;

    &:hover {
      color: var(--c-primary);
    }
  }

  &__main {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 20px 64px;
  }

  &__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
    pointer-events: none;

    &--a {
      width: 420px;
      height: 420px;
      top: -120px;
      left: -60px;
      background: #cfe0ff;
    }

    &--b {
      width: 360px;
      height: 360px;
      right: -80px;
      bottom: -120px;
      background: #ffe3d5;
    }
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.3px;
  }

  &__mark {
    display: flex;
    filter: drop-shadow(0 6px 12px rgba(43, 108, 255, 0.24));
  }
}
</style>
