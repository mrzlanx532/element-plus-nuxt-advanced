<script setup lang="ts">
import type { IFilter } from './browser'
import { ref, watch } from 'vue'
import dayjs from 'dayjs'

type IValueRaw = number|string|null
type IValueSingle = [IValueRaw]
type IValueRange = [IValueRaw, IValueRaw]
type IValue = IValueSingle | IValueRange

const props = withDefaults(defineProps<{
  filter: IFilter,
  value?: IValue,
}>(), {
  value: undefined
})

const emit = defineEmits<{
  'update:value': [value: any]
}>()

const value = ref<(number|string|null)[]|undefined>(undefined)
const valueFormatMapper: {[key: string]: string} = {
  'timestamp': 'X',
  'datetime_with_tz': 'DD.MM.YYYY HH:mm:ss',
  'datetime_with_tz_convertless': 'DD.MM.YYYY HH:mm:ss',
  'date' : 'DD.MM.YYYY'
}

const valueFormat = ref(valueFormatMapper[props.filter.config.strategy])

watch(() => props.value, (v) => {
  if (v === undefined) {
    if (props.filter.config.range) {
      value.value = ["", ""]
      return
    }

    value.value = [""]
    return
  }

  value.value = Array.isArray(v) ? [...v] : v
}, {
  immediate: true,
  deep: true
})

const updateModelValueSingleTimestampStrategy = (val: IValueRaw) => {
  if (val === null) {
    emit('update:value', undefined)
    return
  }

  emit('update:value', val)
  return
}

const updateModelValueSingleDateStrategy = (val: IValueRaw) => {
  if (val === null) {
    emit('update:value', undefined)
    return
  }

  emit('update:value', val)
  return
}

const updateModelValueSingleDatetimeWithTZStrategy = (val: IValueRaw) => {

  if (val) {
    val = dayjs(val, 'DD.MM.YYYY HH:mm:ss').tz(dayjs.tz.guess()).format('DD.MM.YYYY HH:mm:ssZ')
  }

  if (val === null) {
    emit('update:value', undefined)
    return
  }

  emit('update:value', val)
  return
}

const updateModelValueRangeTimestampStrategy = (index: number, val: IValueRaw) => {

  value.value![index] = val

  if (val === null) {
    value.value![index] = ''
  }

  if (Array.isArray(value.value) && value.value[0] === '' && value.value[1] === '') {
    emit('update:value', undefined)
    return
  }

  emit('update:value', value.value)
}

const updateModelValueRangeDateStrategy = (index: number, val: IValueRaw) => {

  value.value![index] = val

  if (val === null) {
    value.value![index] = ''
  }

  if (Array.isArray(value.value) && value.value[0] === '' && value.value[1] === '') {
    emit('update:value', undefined)
    return
  }

  emit('update:value', value.value)
}

const updateModelValueRangeDatetimeWithTZStrategy = (index: number, val: IValueRaw) => {

  value.value![index] = val

  if (value.value && value.value[index]) {
    value.value![index] = dayjs(val, 'DD.MM.YYYY HH:mm:ss').tz(dayjs.tz.guess()).format('DD.MM.YYYY HH:mm:ssZ')
  }

  emit('update:value', value.value)
  return
}

const updateModelValueSingle = (val: IValueRaw) => {
  if (props.filter.config.strategy === 'timestamp') {
    updateModelValueSingleTimestampStrategy(val)
    return
  }

  if (props.filter.config.strategy === 'date') {
    updateModelValueSingleDateStrategy(val)
    return
  }

  if (['datetime_with_tz', 'datetime_with_tz_convertless'].includes(props.filter.config.strategy)) {
    updateModelValueSingleDatetimeWithTZStrategy(val)
    return
  }
}

const updateModelValueRange = (index: number, val: IValueRaw) => {
  if (props.filter.config.strategy === 'timestamp') {
    updateModelValueRangeTimestampStrategy(index, val)
    return
  }

  if (props.filter.config.strategy === 'date') {
    updateModelValueRangeDateStrategy(index, val)
    return
  }

  if (['datetime_with_tz', 'datetime_with_tz_convertless'].includes(props.filter.config.strategy)) {
    updateModelValueRangeDatetimeWithTZStrategy(index, val)
    return
  }
}
</script>

<template>
  <template v-if="props.filter.config.range">
    <ElDatePicker
        :model-value="Array.isArray(value) ? value[0] : undefined"
        type="date"
        placeholder="От"
        @update:model-value="(v: any) => updateModelValueRange(0, v)"
        format="DD.MM.YYYY"
        :value-format="valueFormat"
        clearable
    />
    <ElDatePicker
        :model-value="Array.isArray(value) ? value[1] : undefined"
        type="date"
        placeholder="До"
        @update:model-value="(v: any) => updateModelValueRange(1, v)"
        format="DD.MM.YYYY"
        :value-format="valueFormat"
        clearable
    />
  </template>
  <ElDatePicker
      v-else
      :model-value="Array.isArray(value) ? value[0] : value"
      type="date"
      placeholder="Выберите дату"
      @update:model-value="updateModelValueSingle"
      format="DD.MM.YYYY"
      :value-format="valueFormat"
      clearable
  />
</template>
