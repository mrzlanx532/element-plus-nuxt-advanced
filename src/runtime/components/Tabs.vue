<script setup lang="ts">
import { type Component, type Ref, useTemplateRef, ref, watch } from 'vue'

export interface ITabItem {
  title: string,
  component: Component,
  hasError?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: number,
  tabs: ITabItem[]
}>(), {
  modelValue: 0
})

const emit = defineEmits(['update:modelValue'])

type TMouseUpListener = () => void
type TMouseMoveListener = (e: MouseEvent) => void

let mouseUpListener: null|TMouseUpListener = null
let mouseMoveListener: null|TMouseMoveListener = null

const localSelectedItem = ref(0)
const isDraggable = ref(false)
const currentScrolledLeft: Ref<number|null> = ref(null)
const screenXWhenMouseDown: Ref<number|null> = ref(null)
const tabsEl = useTemplateRef<HTMLElement>('tabsEl')

watch(() => props.modelValue, (v) => {
  localSelectedItem.value = v
}, {
  immediate: true
})

const documentPointerUpListener = (): void => {
  isDraggable.value = false
  screenXWhenMouseDown.value = null
  currentScrolledLeft.value = null

  document.removeEventListener('pointerup', mouseUpListener as TMouseUpListener)
  document.removeEventListener('pointermove', mouseMoveListener as TMouseMoveListener)

  mouseUpListener = null
  mouseMoveListener = null
}

const documentPointerMoveListener = (e: MouseEvent) => {
  if (!isDraggable.value) {
    return
  }

  tabsEl.value!.scrollTo(
    (screenXWhenMouseDown.value! + currentScrolledLeft.value!) - e.screenX,
      tabsEl.value!.offsetTop
  )
}

const onMouseDown = (e: MouseEvent) => {
  isDraggable.value = true
  currentScrolledLeft.value = tabsEl.value!.scrollLeft
  screenXWhenMouseDown.value = e.screenX

  mouseUpListener = documentPointerUpListener.bind(document)
  mouseMoveListener = documentPointerMoveListener.bind(null)

  document.addEventListener('pointerup', mouseUpListener)
  document.addEventListener('pointermove', mouseMoveListener)
}
</script>

<template>
  <div
    ref="tabsEl"
    class="tabs"
    @mousedown="onMouseDown"
  >
    <div
      v-for="(tab, index) in tabs"
      class="tabs__item"
      :class="{
        'tabs__item_active': localSelectedItem === index,
        '--with-error': tab.hasError
      }"
      @click="emit('update:modelValue', index)"
    >
      {{ tab.title }}
    </div>
  </div>
</template>
