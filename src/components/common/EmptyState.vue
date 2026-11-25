<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    actionText?: string
    compact?: boolean
  }>(),
  {
    title: '这里还没有内容',
    description: '',
    icon: '📭',
    actionText: '',
    compact: false,
  },
)

defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="empty" :class="{ 'empty--compact': compact }">
    <div class="empty__icon">{{ icon }}</div>
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <slot>
      <button v-if="actionText" class="empty__btn" type="button" @click="$emit('action')">
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 64px 20px;
  text-align: center;
  color: var(--c-text-3);

  &--compact {
    padding: 32px 16px;
  }

  &__icon {
    font-size: 34px;
    line-height: 1;
    margin-bottom: 4px;
    opacity: 0.9;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--c-text-2);
  }

  &__desc {
    font-size: 13px;
    max-width: 320px;
  }

  &__btn {
    margin-top: 8px;
    height: 34px;
    padding: 0 18px;
    border: 1px solid var(--c-primary-line);
    border-radius: 999px;
    background: var(--c-primary-weak);
    color: var(--c-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #e2ecff;
    }
  }
}
</style>
