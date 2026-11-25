<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { readableColor, withAlpha } from '@/utils/color'

const props = withDefaults(
  defineProps<{
    name: string
    color?: string
    tagId?: number
    size?: 'sm' | 'md'
    linkable?: boolean
    count?: number
  }>(),
  { color: '#2b6cff', size: 'sm', linkable: true },
)

const style = computed(() => ({
  color: readableColor(props.color),
  background: withAlpha(props.color, 0.12),
}))

const label = computed(() => (props.count === undefined ? props.name : `${props.name} · ${props.count}`))
</script>

<template>
  <RouterLink
    v-if="linkable && tagId"
    :to="`/tag/${tagId}`"
    class="tag-chip"
    :class="`tag-chip--${size}`"
    :style="style"
  >
    {{ label }}
  </RouterLink>
  <span v-else class="tag-chip" :class="`tag-chip--${size}`" :style="style">{{ label }}</span>
</template>

<style scoped lang="scss">
.tag-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  transition: transform 0.16s ease, filter 0.16s ease;

  &--md {
    height: 28px;
    padding: 0 13px;
    font-size: 13px;
  }

  &:hover {
    filter: brightness(0.96);
    transform: translateY(-1px);
  }
}
</style>
