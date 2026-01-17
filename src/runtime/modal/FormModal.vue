<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import { Close as IconClose } from '@element-plus/icons-vue'
import { provide, toRef, ref, useTemplateRef, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  isReady: boolean,
  errors: {[key: string]: string[]},
  title: string
}>(), {
  errors: () => ({})
})

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'save'): void,
}>()

const errorsRef = toRef(props, 'errors')

provide('errors', errorsRef)

const scrollTemplateRef = useTemplateRef('scrollTemplateRef')

const isFixedReady = ref(false)

let pointerDownOnOverlay = false

const updateDimensions = () => {
  if (scrollTemplateRef.value) {
    scrollTemplateRef.value.getElement()!.style.maxHeight = window.innerHeight * 0.9 + 'px'

    const contentEl = document.querySelector<HTMLDivElement>('.modal.--fixed-top .modal__container')

    if (contentEl) {
      contentEl.style.marginTop = ((window.innerHeight - contentEl.offsetHeight) / 2) + 'px'
    }

    isFixedReady.value = true
  }
}

const onPointerDownOverlay = () => {
  pointerDownOnOverlay = true
}

const onPointerUpOverlay = (close: () => void) => {
  if (pointerDownOnOverlay) {
    close()
  }

  pointerDownOnOverlay = false
}

onMounted(() => {
  window.addEventListener('resize', updateDimensions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})
</script>

<template>
  <VueFinalModal
      class="modal"
      content-transition="vfm-fade"
      :hide-overlay="true"
      @closed="emit('close')"
      @opened="updateDimensions"
  >
    <!-- @vue-ignore -->
    <template #default="{ close }">
      <div class="modal__overlay" ref="overlayTemplateRef" @pointerup.self="onPointerUpOverlay(close)" @pointerdown.self="onPointerDownOverlay">
        <div class="modal__container" :class="{'--loading': !props.isReady || !isFixedReady}">
          <OverlayScrollbarsComponent class="modal-custom-scroll" ref="scrollTemplateRef">
            <div class="modal__content">
              <form class="form">
                <div class="form__header">
                  <div class="form__header-section-top">
                    <div class="form__header-title">{{ props.title }}</div>
                    <div class="form__header-close-button" >
                      <IconClose @click="close"/>
                    </div>
                  </div>
                  <slot name="header" />
                </div>
                <div class="form__content">
                  <slot name="default" />
                </div>
                <div class="form__footer">
                  <el-button-group>
                    <el-button type="success" @click.prevent="emit('save')">Сохранить</el-button>
                    <el-button @click="close">Отмена</el-button>
                  </el-button-group>
                </div>
              </form>
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>
    </template>
  </VueFinalModal>
</template>
