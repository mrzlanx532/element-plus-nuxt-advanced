<script setup lang="ts">
import { nextTick, watch, ref, useTemplateRef } from 'vue'

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

const textareaEl = useTemplateRef('textareaEl')

const internalValue = ref()

const props = defineProps<{
  modelValue?: string
}>()

const setLocalValues = (value: any) => {
  internalValue.value = value

  nextTick(() => {
    triggerAutosize()
  })
}

watch(
    () => props.modelValue,
    (value) => {
      setLocalValues(value)
    },
    {
      immediate: true
    }
)

const triggerAutosize = () => {
  textareaEl.value!.style.height = "50px";
  textareaEl.value!.style.height = textareaEl.value!.scrollHeight + 2 + "px";
}

const onInput = () => {
  triggerAutosize()
  emit('update:modelValue', internalValue.value)
}
</script>

<template>
  <textarea spellcheck="false" class="textarea" @input="onInput" ref="textareaEl" v-model="internalValue"/>
</template>
