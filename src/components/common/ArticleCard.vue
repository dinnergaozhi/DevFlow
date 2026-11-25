<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AuthorAvatar from './AuthorAvatar.vue'
import TagChip from './TagChip.vue'
import { formatCount, formatRelativeTime } from '@/utils/format'
import { readableColor, withAlpha } from '@/utils/color'
import type { Article } from '@/types'

const props = withDefaults(
  defineProps<{
    article: Article
    variant?: 'list' | 'compact' | 'plain'
    showThumb?: boolean
    rank?: number
  }>(),
  { variant: 'list', showThumb: true },
)

const authorName = computed(() => props.article.author?.nickname || `作者 #${props.article.author_id}`)
const tagColor = computed(() => props.article.tag?.color || '#2b6cff')
const isHot = computed(() => props.article.views >= 500_000)

const thumbStyle = computed(() => ({
  background: `linear-gradient(135deg, ${withAlpha(tagColor.value, 0.16)}, ${withAlpha(tagColor.value, 0.06)})`,
  color: readableColor(tagColor.value),
}))
</script>

<template>
  <article class="article-card" :class="[`article-card--${variant}`]">
    <div v-if="rank" class="article-card__rank" :class="{ 'is-top': rank <= 3 }">{{ rank }}</div>

    <div class="article-card__main">
      <RouterLink class="article-card__title" :to="`/article/${article.id}`">
        <span v-if="isHot" class="hot-flag">热</span>{{ article.title }}
      </RouterLink>

      <p v-if="variant !== 'compact'" class="article-card__summary line-clamp-2">{{ article.summary }}</p>

      <div class="article-card__meta">
        <TagChip :name="article.tag_name" :color="tagColor" :tag-id="article.tag_id" />
        <span class="meta-dot" />
        <RouterLink class="meta-author" :to="`/author/${article.author_id}`">
          <AuthorAvatar :name="authorName" :size="18" />
          <span class="text-ellipsis">{{ authorName }}</span>
        </RouterLink>
        <span class="meta-dot" />
        <span class="meta-text">{{ formatRelativeTime(article.published_at) }}</span>
        <template v-if="variant !== 'compact'">
          <span class="meta-dot" />
          <span class="meta-text">{{ formatCount(article.views) }} 阅读</span>
          <span class="meta-dot" />
          <span class="meta-text">{{ formatCount(article.likes) }} 赞</span>
        </template>
      </div>
    </div>

    <div v-if="showThumb && variant === 'list'" class="article-card__thumb" :style="thumbStyle">
      <span class="article-card__thumb-text">{{ article.tag_name }}</span>
      <span class="article-card__thumb-cat">{{ article.category }}</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.article-card {
  position: relative;
  display: flex;
  gap: 18px;
  padding: 18px 20px;
  border-radius: var(--radius);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  & + & {
    border-top: 1px solid var(--c-border);
  }

  &:hover {
    background: #fbfcff;
  }

  &--compact {
    gap: 12px;
    padding: 12px 4px;
    align-items: flex-start;

    .article-card__title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.5;
    }

    .article-card__meta {
      margin-top: 8px;
    }
  }

  &--plain {
    padding: 12px 4px;

    & + & {
      border-top: 1px dashed var(--c-border);
    }
  }

  &__rank {
    position: absolute;
    left: 0;
    top: 22px;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 8px 0 8px 0;
    background: #eef1f7;
    color: var(--c-text-3);
    font-size: 12px;
    font-weight: 700;
    font-style: italic;

    &.is-top {
      background: var(--c-accent-weak);
      color: var(--c-accent);
    }
  }

  &--compact &__rank {
    top: 14px;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: block;
    font-size: 17px;
    font-weight: 650;
    line-height: 1.5;
    color: var(--c-text);
    letter-spacing: 0.1px;
    transition: color 0.18s ease;

    &:hover {
      color: var(--c-primary);
    }
  }

  &__summary {
    margin-top: 8px;
    font-size: 13.5px;
    line-height: 1.7;
    color: var(--c-text-2);
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    font-size: 12.5px;
    color: var(--c-text-3);
  }

  &__thumb {
    position: relative;
    flex: none;
    width: 118px;
    height: 82px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    overflow: hidden;
    transition: transform 0.2s ease;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.75), transparent 42%);
      pointer-events: none;
    }
  }

  &__thumb-text {
    max-width: 100px;
    font-size: 14px;
    font-weight: 750;
    letter-spacing: 0.2px;
    text-align: center;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__thumb-cat {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.62;
  }

  &:hover &__thumb {
    transform: scale(1.03);
  }
}

.meta-author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 160px;
  color: var(--c-text-2);
  font-weight: 500;
  transition: color 0.18s ease;

  &:hover {
    color: var(--c-primary);
  }
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #c9d1e0;
}

.hot-flag {
  display: inline-flex;
  align-items: center;
  height: 17px;
  padding: 0 5px;
  margin-right: 7px;
  border-radius: 5px;
  background: var(--c-accent-weak);
  color: var(--c-accent);
  font-size: 11px;
  font-weight: 700;
  vertical-align: 2px;
}

@media (max-width: 720px) {
  .article-card {
    padding: 16px;

    &__title {
      font-size: 16px;
    }

    &__thumb {
      width: 92px;
      height: 66px;
    }

    &__thumb-text {
      font-size: 12.5px;
      max-width: 78px;
    }

    &__summary {
      -webkit-line-clamp: 2;
    }
  }
}
</style>
