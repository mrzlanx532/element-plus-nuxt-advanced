<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'
import type { IFilter } from './browser'

const props = withDefaults(defineProps<{
  filter: IFilter,
  value?: any[],
}>(), {
  value: () => []
})

const emit = defineEmits<{
  'update:value': [value: any]
}>()
</script>

<template>
  <ElSelect
      :model-value="props.filter.config.multiple ? value : value?.[0]"
      @update:model-value="(val: any) => emit('update:value', val)"
      :filterable="props.filter.config.filter"
      :multiple="props.filter.config.multiple"
      clearable
  >
    <ElOption
        v-for="item in props.filter.options"
        :key="item.id"
        :label="item.title"
        :value="item.id"
    />
  </ElSelect>
</template>
