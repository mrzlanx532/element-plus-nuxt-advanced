<script setup lang="ts">
import { ref, watch } from 'vue'
const props = withDefaults(defineProps<{
  isOpen: boolean,
  item: any|null
}>(), {
  isOpen: false,
  item: null
})

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const isOpen = ref(false)

watch(() => props.isOpen, (v) => {
  isOpen.value = v
})
</script>

<template>
  <el-drawer class="browser__detail" :model-value="isOpen" @update:model-value="(v: boolean) => emit('update:isOpen', v)" direction="rtl">
    <template #header v-if="props.item">
      <div class="browser__detail-column">
        <slot name="detail-header">
          <div class="browser__detail-header">
            {{ props.item ? props.item.id : undefined }}
          </div>
        </slot>
      </div>
    </template>
    <template #default>
      <el-scrollbar :always="true" height="100%">
        <div class="browser__detail-content">
          <slot name="detail-content" />
        </div>
      </el-scrollbar>
    </template>
  </el-drawer>
</template>
