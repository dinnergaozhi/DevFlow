<script setup lang="ts">
import { computed } from 'vue'
import { hueOf, initials } from '@/utils/format'

const props = withDefaults(defineProps<{ name: string; size?: number; square?: boolean }>(), {
  size: 28,
  square: false,
})

const style = computed(() => {
  const hue = hueOf(props.name || '?')
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${Math.round(props.size * 0.42)}px`,
    borderRadius: props.square ? `${Math.round(props.size * 0.28)}px` : '50%',
    background: `linear-gradient(135deg, hsl(${hue} 78% 62%), hsl(${(hue + 42) % 360} 74% 50%))`,
  }
})
</script>

<template>
  <span class="avatar" :style="style" :title="name">{{ initials(name) }}</span>
</template>

<style scoped lang="scss">
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
  user-select: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}
</style>
