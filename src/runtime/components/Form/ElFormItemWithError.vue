<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'

const props = defineProps<{
  label: string,
  name: string,
}>()

const errors = inject<Ref<{[key: string]: string[]}>>('errors', ref({}))
</script>

<template>
  <el-form-item :label="props.label">
    <slot />
    <div class="input__error">{{ errors[props.name] ? errors[props.name]![0] : '' }}</div>
  </el-form-item>
</template>
