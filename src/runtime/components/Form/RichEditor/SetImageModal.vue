<script setup lang="ts">
import { ref } from 'vue'
import FormModal from '#backoffice-ui/modal/FormModal.vue'
import ElFormItemWithError from '#backoffice-ui/components/Form/ElFormItemWithError.vue'
import InputFile from "#backoffice-ui/components/Form/InputFile.vue";
import type { SetImageFormData } from './index'
import { useForm } from '#imports'

const props = defineProps<{
  entity_id: number
  entity_type: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', value: { url: string, id?: number }): void
}>()

const formData = ref<SetImageFormData>({
  entity_id: props.entity_id,
  entity_type: props.entity_type,
  image: undefined,
})

const outerSrc = ref('')

const {
  initForm
} = useForm()

const {
  save,
  errors
} = initForm(
    ['image'],
    formData,
    'editor/images/load',
)

const onSave = async () => {
  try {
    if (formData.value.image) {
      const response = await save<{
        url: string
        id: number
      }>()

      emit('submit', response!)
      return
    }

    emit('submit', {
      url: outerSrc.value
    })

  } catch (e) {
    throw e
  }
}
</script>

<template>
  <FormModal
      class="--small"
      @save="onSave"
      :errors="errors"
      is-ready
      title="Добавление изображения"
  >
    <el-form label-position="top" @submit.prevent="onSave">
      <el-form-item-with-error label="Загрузить изображение" name="text">
        <InputFile :max-size-mb="10" :model-value="formData.image" @update:model-value="(v) => { formData.image = v; outerSrc = ''; }" />
      </el-form-item-with-error>
      <el-form-item-with-error label="Внешний URL" name="outer">
        <el-input @input="formData.image = undefined" v-model="outerSrc" placeholder="Вставить ссылку.." />
      </el-form-item-with-error>
    </el-form>
  </FormModal>
</template>
