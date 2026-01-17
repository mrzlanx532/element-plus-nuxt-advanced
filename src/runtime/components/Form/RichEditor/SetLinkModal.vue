<script setup lang="ts">
import { ref, watch } from 'vue'
import FormModal from '#backoffice-ui/modal/FormModal.vue'
import ElFormItemWithError from '#backoffice-ui/components/Form/ElFormItemWithError.vue'
import type { SetLinkFormData } from './index'

const props = defineProps<{
  text: string,
  link?: string,
  inNewWindow?: boolean,
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', value: SetLinkFormData): void
}>()

const formData = ref<SetLinkFormData>({
  text: '',
  link: '',
  inNewWindow: false,
})

watch(() => ({ ...props }), (v) => {
  formData.value = v as SetLinkFormData
}, {
  immediate: true,
})

const errors = ref<{[key: string]: [string]}>({})

const onSave = () => {

  delete errors.value['link']

  if (formData.value['link'] === '') {
    errors.value['link'] = ['Поле обязательно для заполнения']
    return
  }

  if (!(isValidHttpUrl(formData.value['link']))) {
    errors.value['link'] = ['Невалидная ссылка']
    return
  }

  emit('submit', formData.value)
}

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
</script>

<template>
  <FormModal
      class="--small"
      @save="onSave"
      :errors="errors"
      is-ready
      title="Добавление ссылки"
  >
    <el-form label-position="top" @submit.prevent="onSave">
      <el-form-item-with-error label="Текст" name="text">
        <el-input v-model="formData.text" placeholder="Вставить текст.." />
      </el-form-item-with-error>
      <el-form-item-with-error label="Ссылка" name="link">
        <el-input v-model="formData.link" placeholder="Вставить ссылку.." />
      </el-form-item-with-error>
      <el-checkbox v-model="formData.inNewWindow">В новом окне</el-checkbox>
    </el-form>
  </FormModal>
</template>
