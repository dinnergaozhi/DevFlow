<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { formatCount } from '@/utils/format'
import { readableColor } from '@/utils/color'
import type { Article } from '@/types'

defineProps<{ articles: Article[] }>()
</script>

<template>
  <ol class="hot-rank">
    <li v-for="(item, index) in articles" :key="item.id" class="hot-rank__item">
      <span class="hot-rank__no" :class="{ 'is-top': index < 3 }">{{ index + 1 }}</span>
      <RouterLink class="hot-rank__title line-clamp-2" :to="`/article/${item.id}`">{{ item.title }}</RouterLink>
      <span class="hot-rank__views" :style="{ color: readableColor(item.tag?.color || '#2b6cff') }">
        {{ formatCount(item.views) }}
      </span>
    </li>
  </ol>
</template>

<style scoped lang="scss">
.hot-rank {
  padding: 6px 18px 14px;

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;

    & + & {
      border-top: 1px dashed var(--c-border);
    }
  }

  &__no {
    flex: none;
    width: 18px;
    margin-top: 2px;
    font-size: 13px;
    font-weight: 800;
    font-style: italic;
    text-align: center;
    color: #b9c2d4;

    &.is-top {
      color: var(--c-accent);
    }
  }

  &__title {
    flex: 1;
    min-width: 0;
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--c-text);
    transition: color 0.16s ease;

    &:hover {
      color: var(--c-primary);
    }
  }

  &__views {
    flex: none;
    margin-top: 2px;
    font-size: 11.5px;
    font-weight: 600;
    opacity: 0.72;
  }
}
</style>
