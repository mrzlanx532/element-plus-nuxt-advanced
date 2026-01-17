<script setup lang="ts">
import { Search as IconSearch } from '@element-plus/icons-vue'
import { CircleClose as IconCircleClose } from '@element-plus/icons-vue'
import { useTemplateRef, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  header: string,
  searchString?: string
}>(), {
  searchString: '',
})

const emit = defineEmits<{
  (e: 'update:searchString', value: string): void
}>()

const rootTemplateRef = useTemplateRef('rootTemplateRef')

const searchString = ref<string>('')

const onInputChange = (value: string) => {
  emit('update:searchString', value)
}

const onClickSearch = () => {
  if (searchString.value === props.searchString) {
    return
  }

  emit('update:searchString', searchString.value)
}

const onInput = (value: string) => {
  if (value === '') {
    emit('update:searchString', '')
  }
}

const onInputClear = () => {
  emit('update:searchString', '')
}

watch(() => props.searchString, (value) => {
  searchString.value = value
}, {
  immediate: true
})

defineExpose({
  rootTemplateRef
})
</script>

<template>
  <div class="browser__control-panel" ref="rootTemplateRef">
    <div class="browser__control-panel-column --left">
      <div class="browser__control-panel-page-title">{{ props.header }}</div>
    </div>
    <div class="browser__control-panel-column --center">
      <el-input
          class="browser__control-panel-input"
          v-model="searchString"
          style="width: 242px"
          placeholder="Поиск"
          @change="onInputChange"
          @input="onInput"
      >
        <template #suffix>
          <el-icon v-if="props.searchString !== ''" @click="onInputClear">
            <IconCircleClose />
          </el-icon>
        </template>
        <template #append>
          <el-button :icon="IconSearch" @click="onClickSearch" />
        </template>
      </el-input>
    </div>
    <div class="browser__control-panel-column --right">
      <slot name="control-panel-right" />
    </div>
  </div>
</template>
