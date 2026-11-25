<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  title: string
  moreText?: string
  moreTo?: string
  padded?: boolean
}>()
</script>

<template>
  <section class="section-card card">
    <header class="section-title">
      <h2>
        <span class="dot" />
        {{ title }}
      </h2>
      <RouterLink v-if="moreTo" class="more" :to="moreTo">
        {{ moreText || '查看全部' }}
        <span aria-hidden="true">›</span>
      </RouterLink>
      <slot name="extra" />
    </header>
    <div :class="{ 'section-card__body': padded }">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.section-card {
  overflow: hidden;

  &__body {
    padding: 14px 18px 18px;
  }
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--c-primary);
  vertical-align: middle;
}
</style>
