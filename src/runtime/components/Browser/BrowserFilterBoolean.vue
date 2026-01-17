<script setup lang="ts">
import { ref, watch } from 'vue'
import type { IFilter } from './browser'

const props = withDefaults(defineProps<{
  filter: IFilter,
  value?: [boolean]
}>(), {
  value: undefined
})

const emit = defineEmits<{
  'update:value': [value: [boolean]|undefined]
}>()

const value = ref<number>(-1)

watch(() => props.value, (v: [boolean] | undefined) => {
  if (v === undefined) {
    value.value = -1
    return
  }

  value.value = Number(v[0])
}, {
  immediate: true,
})

const updateModelValue = (v: string | number | boolean | undefined) => {
  if (v === -1) {
    emit('update:value', undefined)
    return
  }

  emit('update:value', [Boolean(v)])
}
</script>

<template>
  <el-radio-group class="browser__boolean-filter" :model-value="value" @update:model-value="updateModelValue">
    <el-radio :value=-1>Не задано</el-radio>
    <el-radio :value="1">Да</el-radio>
    <el-radio :value="0">Нет</el-radio>
  </el-radio-group>
</template>
