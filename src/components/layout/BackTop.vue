<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Top } from '@element-plus/icons-vue'

const visible = ref(false)
const progress = ref(0)

function onScroll(): void {
  const top = window.scrollY
  const height = document.documentElement.scrollHeight - window.innerHeight
  visible.value = top > 560
  progress.value = height > 0 ? Math.min(1, top / height) : 0
}

function backToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <transition name="fade">
    <button v-show="visible" class="back-top" type="button" title="回到顶部" @click="backToTop">
      <svg class="back-top__ring" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#e6ecf7" stroke-width="2" />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#2b6cff"
          stroke-width="2"
          stroke-linecap="round"
          :stroke-dasharray="`${progress * 113} 113`"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <el-icon :size="16"><Top /></el-icon>
    </button>
  </transition>
</template>

<style scoped lang="scss">
.back-top {
  position: fixed;
  right: 26px;
  bottom: 42px;
  z-index: 80;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--c-border);
  border-radius: 50%;
  background: #fff;
  color: var(--c-primary);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  &__ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
}

@media (max-width: 760px) {
  .back-top {
    right: 16px;
    bottom: 86px;
  }
}
</style>
