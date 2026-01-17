<script setup lang="ts">
import { type IResponse, type IItem } from './browser'
import { useNuxtApp, useMinDelay } from '#imports'
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  url: string,
  filters: {[key: string]: any},
  refreshIncrement?: number
}>(), {
  refreshIncrement: 0
})

const { $authFetch } = useNuxtApp()

const data = ref<IItem[]>([])
const isFetching = ref(false)
const isFirstLoading = ref(true)

/** pagination */
const page = ref(1)
const perPage = ref(5)
const total = ref(0)

const { loading, start, stop } = useMinDelay()

const onPageChange = async (value: number) => {
  page.value = value
  await fetch()
}

const fetch = async () => {
  try {
    isFetching.value = true

    if (isFirstLoading.value) {
      start()
    }

    const response = await $authFetch<IResponse>(props.url, {
      query: {
        filters: JSON.stringify(props.filters),
        page: page.value,
        per_page: perPage.value,
      }
    })

    data.value = response.items
    total.value = response.meta.count

    if (isFirstLoading.value) {
      stop()
      isFirstLoading.value = false
    }

  } catch (err: unknown) {} finally {
    isFetching.value = false
  }
}

watch(() => props.refreshIncrement, () => {
  page.value = 1
  fetch()
})

onMounted(async () => {
  await fetch()
})
</script>

<template>
  <div
      v-if="loading"
      v-loading="true"
      class="browser-in-detail__loader"
      :class="{'--active': true}"
      :style="{height: '300px'}"
  />
  <div class="browser-in-detail" v-if="!isFirstLoading && !loading">
    <div class="browser-in-detail__row --top">
      <el-pagination
          size="small"
          :total="total"
          background
          layout="total, prev, pager, next"
          v-model:current-page="page"
          v-model:page-size="perPage"
          @current-change="onPageChange"
      />
      <slot name="action" />
    </div>
    <el-table
      :show-header="false"
      :data="data"
      :class="{'--loading': isFetching || loading}"
    >
      <slot name="table" />
    </el-table>
    <div class="browser-in-detail__row --bottom" v-if="total > 0">
      <el-pagination
          size="small"
          :total="total"
          background
          layout="total, prev, pager, next"
          v-model:current-page="page"
          v-model:page-size="perPage"
          @current-change="onPageChange"
      />
      <slot name="action" />
    </div>
  </div>
</template>
