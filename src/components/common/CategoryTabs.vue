<script setup lang="ts">
defineProps<{
  tabs: { name: string; count?: number }[]
  modelValue: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="tabs__item"
      :class="{ 'is-active': modelValue === tab.name }"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.name"
      @click="emit('update:modelValue', tab.name)"
    >
      {{ tab.name }}
      <span v-if="tab.count" class="tabs__count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &__item {
    position: relative;
    flex: none;
    padding: 10px 14px;
    border: 0;
    border-radius: 10px 10px 0 0;
    background: transparent;
    color: var(--c-text-2);
    font-size: 14.5px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.18s ease, background 0.18s ease;

    &:hover {
      color: var(--c-primary);
      background: var(--c-primary-weak);
    }

    &.is-active {
      color: var(--c-primary);
      font-weight: 700;

      &::after {
        content: '';
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: 2px;
        height: 3px;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--c-primary), #6f9bff);
      }
    }
  }

  &__count {
    margin-left: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--c-text-3);
  }
}
</style>
