<script setup lang="ts">
import { ElInput } from 'element-plus'
import type { IFilter } from './browser'
import { CircleClose as IconCircleClose } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'

type IValueRaw = string|number
type IValueSingle = [IValueRaw]
type IValueRange = [IValueRaw, IValueRaw]

type IValue = IValueSingle | IValueRange

const props = withDefaults(defineProps<{
  filter: IFilter,
  value?: IValue
}>(), {
  value: undefined
})

const emit = defineEmits<{
  'update:value': [value: any[]|undefined]
}>()

const unconfirmedValue = ref<IValue | undefined>(undefined)
const confirmedValue = ref<IValue | undefined>(undefined)

watch(() => props.value, (v) => {

  if (v === undefined) {
    if (props.filter.config.range) {
      unconfirmedValue.value = ["", ""]
      confirmedValue.value = ["", ""]

      return
    }

    unconfirmedValue.value = [""]
    confirmedValue.value = [""]

    return
  }

  unconfirmedValue.value = Array.isArray(v) ? [...v] : v
  confirmedValue.value = Array.isArray(v) ? [...v] : v
}, {
  immediate: true,
  deep: true
})

const onInputRange = (index: number, v: IValueRaw) => {
  (unconfirmedValue.value as IValueRange)[index] = v
}

const onInputSingle = (v: IValueRaw) => {
  (unconfirmedValue.value as IValueSingle)[0] = v
}

const onChangeRange = () => {
  confirmedValue.value = [...(unconfirmedValue.value as IValueRange)]

  if ((confirmedValue.value as IValueRange)[0] === '' && (confirmedValue.value as IValueRange)[1] === '') {
    emit('update:value', undefined)
    return

  }

  emit('update:value', confirmedValue.value as any)
}

const onChangeSingle = () => {
  confirmedValue.value = unconfirmedValue.value

  if ((confirmedValue.value as IValueSingle)[0] === '') {
    emit('update:value', undefined)
    return
  }

  emit('update:value', confirmedValue.value as any)
}

const clearInputRange = (index: number) => {
  (unconfirmedValue.value as IValueRange)[index] = ''
  onChangeRange()
}

const clearInputSingle = () => {
  (unconfirmedValue.value as IValueSingle)[0] = ''
  onChangeSingle()
}
</script>

<template>
  <template v-if="props.filter.config.range">
    <el-input
        class="browser__input-filter"
        :model-value="Array.isArray(unconfirmedValue) ? unconfirmedValue[0] : undefined"
        @update:model-value="(val: any) => onInputRange(0, val)"
        @change="onChangeRange"
        placeholder="От"
    >
      <template #suffix>
        <el-icon v-if="Array.isArray(confirmedValue) && confirmedValue[0] !== ''">
          <IconCircleClose @click="clearInputRange(0)" />
        </el-icon>
      </template>
    </el-input>
    <el-input
        class="browser__input-filter"
        :model-value="Array.isArray(unconfirmedValue) ? unconfirmedValue[1] : undefined"
        @update:model-value="(val: any) => onInputRange(1, val)"
        @change="onChangeRange"
        placeholder="До"
    >
      <template #suffix>
        <el-icon v-if="Array.isArray(confirmedValue) && confirmedValue[1] !== ''">
          <IconCircleClose @click="clearInputRange(1)" />
        </el-icon>
      </template>
    </el-input>
  </template>
  <el-input
      v-else
      class="browser__input-filter"
      :model-value="Array.isArray(unconfirmedValue) ? unconfirmedValue[0] : undefined"
      @change="onChangeSingle"
      @update:model-value="onInputSingle"
  >
    <template #suffix>
      <el-icon v-if="Array.isArray(confirmedValue) && confirmedValue[0] !== ''">
        <IconCircleClose @click="clearInputSingle" />
      </el-icon>
    </template>
  </el-input>
</template>
