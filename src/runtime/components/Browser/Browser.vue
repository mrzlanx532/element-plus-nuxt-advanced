<script setup lang="ts">
import { type FetchError } from 'ofetch'
import BrowserControlPanel from '#backoffice-ui/components/Browser/BrowserControlPanel.vue'
import BrowserFilters from '#backoffice-ui/components/Browser/BrowserFilters.vue'
import BrowserDetail from '#backoffice-ui/components/Browser/BrowserDetail.vue'
import { cloneVNode, useSlots, ref, useTemplateRef, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import type { IItem } from './browser'
import { useRouter, useRoute, useMinDelay, useNuxtApp } from '#imports'
import type {
  IFilter,
  IResponse
} from './browser'

const props = withDefaults(defineProps<{
  url: string,
  urlDetail: string,
  perPageSizes?: number[],
  detailIdProperty?: string,
  header: string,
  /** like a hooks */
  refreshIncrement?: number,
  fetchIncrement?: number,
  fetchDetailIncrement?: number,
}>(), {
  perPageSizes: () => [20, 50, 100],
  detailIdProperty: 'id',
  refreshIncrement: 0,
  fetchIncrement: 0,
  fetchDetailIncrement: 0
})

const emit = defineEmits<{
  'selection-change': [value: any[]],
  'item-updated': [value: {[key:string]: any}],
  'detail-closed': []
}>()

const slots = useSlots()
const router = useRouter()
const route = useRoute()

const searchString = ref(route.query.search_string ? route.query.search_string as string : undefined)

interface SortChangedValue {
  order: 'descending' | 'ascending',
  prop: string
}

interface IRequestParams {
  filters?: {},
  search_string?: string,
  sort?: {
    field: string,
    direction: string
  }
  per_page: number,
  page: number
}

const controlPanelTemplateRef = useTemplateRef<typeof BrowserControlPanel>('controlPanelTemplateRef')
const browserContainerTemplateRef = useTemplateRef('browserContainerTemplateRef')

const data = ref<IItem[]>([])
const isFirstLoading = ref(true)
const isFetching = ref(false)
const { loading, start, stop } = useMinDelay()

/** bulk action */
const detailSelectionItems = ref<any[]>([])

/** detail */
const detailIsOpen = ref(false)
const detailItem = ref<{[key: string]: any}|null>(null)
const detailItemId = route.query[props.detailIdProperty] ? ref(parseInt(route.query[props.detailIdProperty] as string)) : ref(undefined)

/** auto-size */
let ro: ResizeObserver | undefined = undefined
const isHeightRead = ref(false)
const tableHeight = ref('100%')
const tableWidth = ref()

/** pagination */
const page = route.query.page ? ref(parseInt(route.query.page as string)) : ref(1)
const perPage = route.query.per_page ? ref(parseInt(route.query.per_page as string)) : ref(props.perPageSizes[0] as number)
const total = ref(0)

/** sorts */
const sortURL = (() => {
  if (route.query.sort) {
    try {
      const parsed = JSON.parse(route.query.sort as string)

      if (parsed) {
        parsed.prop = parsed.field
        parsed.order = undefined

        if (parsed.value === 'desc') {
          parsed.order = 'descending'
        }

        if (parsed.value === 'asc') {
          parsed.order = 'ascending'
        }
      }

      return parsed
    } catch (e: unknown) {
     return undefined
    }
  }

  return undefined
})()
const sorts = ref<{[key: string]: any}>(
    sortURL && sortURL.field && sortURL.value && ['asc', 'desc'].includes(sortURL.value) ?
    {[sortURL.field]: sortURL.value}:
    {}
)
const activeSort = ref<string|null>(sortURL && sortURL.field ? sortURL.field : null)
const sortOrderMapper = {
  'descending': 'desc',
  'ascending': 'asc',
} as const

/** filters */
const filters = ref<IFilter[]>([])
const activeFilters = reactive<{[key: string]: any[]}>({})
const tryToParseJSON = (json?: string) => {
  if (!json) {
    return
  }

  try {

    const _activeFilters = JSON.parse(json)

    for (const key in _activeFilters) {
      activeFilters[key] = _activeFilters[key]
    }

  } catch (e) {
    router.push({
      path: route.path,
      query: {
        ...route.query,
        filters: undefined
      }
    })
  }
}

const { $authFetch } = useNuxtApp()

const updateDimensions = () => {

  /** table width */
  const sidebarWidth = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'))
  const sidebarPaddingRight = 30
  const filtersWidth = filters.value.length ? 210 : 0
  const browserGap = filters.value.length ? 10 : 0
  const browserPaddingRight = 30

  /** table height */
  const paginationOffsetHeight = 32
  const totalMargins = 60

  tableHeight.value = (window.innerHeight - paginationOffsetHeight - totalMargins - controlPanelTemplateRef.value!.rootTemplateRef.offsetHeight) + 'px'
  tableWidth.value = (window.innerWidth - sidebarWidth - sidebarPaddingRight - filtersWidth - browserGap - browserPaddingRight) + 'px'
}

const initResizeObserver = () => {
  const body = document.body;
  let lastHeight = body.offsetHeight;
  let lastWidth = body.offsetWidth;

  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const newHeight = entry.contentRect.height;
      const newWidth = entry.contentRect.width;

      if (newHeight !== lastHeight || newWidth !== lastWidth) {
        updateDimensions()
        lastHeight = newHeight;
        lastWidth = newWidth;
      }
    }
  });

  observer.observe(body);

  return observer
}

const onSortChange = (value: SortChangedValue) => {

  page.value = 1

  if (activeSort.value !== value.prop) {
    activeSort.value = value.prop

    for (let sort in sorts.value) {
      sorts.value[sort] = null
    }
  }

  const order = sortOrderMapper[value.order]

  if (value.order !== null) {
    sorts.value[value.prop] = order
  }

  void router.push({
    path: route.path,
    query: {
      ...route.query,
      page: undefined,
      sort: value.order ? JSON.stringify({
        field: value.prop,
        value: order
      }) : undefined
    }
  })

  fetch()
}

const setFilters = (_filters: IFilter[]) => {
  const preparedFilters: IFilter[] = [];
  const preparedFiltersByName: {[key: string]: IFilter} = {};

  _filters.forEach((filter) => {
    preparedFilters.push(filter)
    preparedFiltersByName[filter.id] = filter
  })

  filters.value = preparedFilters
}

const fetch = async () => {

  if (isFirstLoading.value) {
    start()
  }

  isFetching.value = true

  const config: { params?: IRequestParams } = {}

  const requestData = {} as IRequestParams;

  if (Object.keys(activeFilters).length) {
    requestData.filters = activeFilters
  }

  if (searchString.value !== '') {
    requestData.search_string = searchString.value
  }

  if (activeSort.value && sorts.value[activeSort.value]) {
    requestData.sort = {
      field: activeSort.value,
      direction: sorts.value[activeSort.value]
    }
  }

  if (perPage.value !== 20) {
    requestData.per_page = perPage.value
  }

  if (page.value > 1) {
    requestData.page = page.value
  }

  config.params = requestData

  try {
    const response = await $authFetch<IResponse>(props.url, config)

    data.value = response.items
    setFilters(response.filters)

    total.value = response.meta.count
    page.value = response.meta.page
    perPage.value = response.meta.per_page
    sorts.value = response.meta.sort.reduce((acc: {[key: string]: any}, value: string) => {
      return {...acc, [value]: value === activeSort.value ? sorts.value[value] : null}
    }, {})

  } catch (err: unknown) {
    ElNotification({
      title: 'Ошибка сервера',
      message: 'Что-то пошло не так',
      type: 'error',
      duration: 4000
    })
  } finally {
    isFetching.value = false

    if (isFirstLoading.value) {
      stop()
    }
  }
}

const fetchDetail = async () => {

  try {
    detailItem.value = await $authFetch<{[key: string]: any}>(props.urlDetail, {
      query: {
        id: detailItemId.value
      }
    })

    detailIsOpen.value = true
    detailItemId.value = detailItem.value![props.detailIdProperty]

    emit('item-updated', detailItem.value!)

    await router.push({
      path: route.path,
      query: {
        ...route.query,
        id: detailItemId.value
      }
    })
  } catch (e: unknown) {
    if (isFetchError(e)) {
      if (e.status === 404) {
        ElNotification({
          title: 'Запись не найдена',
          type: 'info',
          duration: 2000
        })
      }

      if (e.status && e.status >= 500) {
        ElNotification({
          title: 'Ошибка сервера',
          type: 'error',
          duration: 2000
        })
      }
    }
  }
}

/** Добавляем в каждый <el-table-column>, переданный в слот #table директиву sortable='custom' */
const tableColumns = computed(() => {
  const content = slots['table']?.() ?? []
  return content.map(vnode => {
    if (vnode.type && (vnode.type as any).name === 'ElTableColumn') {
      const extraProps: {sortable?: 'custom'} = {}

      if (vnode.props!.prop in sorts.value) {
        extraProps.sortable = 'custom'
      }

      return cloneVNode(vnode, extraProps)
    }

    return vnode
  })
})

const searchStringUpdated = (value: string) => {
  page.value = 1
  searchString.value = value

  router.push({
    path: route.path,
    query: {
      ...route.query,
      page: undefined,
      search_string: value ? value : undefined
    }
  })

  fetch()
}

const onPageChange = (value: number) => {

  router.push({
    path: route.path,
    query: {
      ...route.query,
      page: value
    }
  })

  page.value = value
  fetch()
}

const onPageSizeChange = (value: number) => {

  router.push({
    path: route.path,
    query: {
      ...route.query,
      per_page: value
    }
  })

  perPage.value = value
  fetch()
}

const processFilterValue = (id: string, value: any) => {
  if (value === undefined) {
    delete activeFilters[id]
    return
  }

  if (Array.isArray(value) && value.length) {
    activeFilters[id] = value
    return
  }

  if (Array.isArray(value) && !value.length) {
    delete activeFilters[id]
    return
  }

  activeFilters[id] = [value]
}

const onFilterChange = (id: string, value: any) => {
  page.value = 1
  processFilterValue(id, value)
  fetch()
  router.push({
    path: route.path,
    query: {
      ...route.query,
      filters: Object.keys(activeFilters).length ? JSON.stringify(activeFilters) : undefined
    }
  })
}

const onFiltersReset = () => {
  page.value = 1
  for (const key in activeFilters) {
    delete activeFilters[key]
  }
  fetch()
  router.push({
    path: route.path,
  })
}

const isFetchError = (e: unknown): e is FetchError => {
  return (
    typeof e === 'object' &&
    e !== null &&
    'request' in e &&
    'response' in e
  )
}

const onRowClick = async (item: any) => {
  detailItemId.value = item[props.detailIdProperty]

  await fetchDetail()
}

const refresh = () => {
  detailIsOpen.value = false
  detailItem.value = null
  page.value = 1
  fetch()
}

const onSelectionChange = (items: any[]) => {
  detailSelectionItems.value = items

  emit('selection-change', detailSelectionItems.value)
}

const onUpdateDetailIsOpen = (isOpen: boolean) => {
  detailIsOpen.value = isOpen

  router.push({
    path: route.path,
    query: {
      ...route.query,
      id: undefined
    }
  })

  emit('detail-closed')
}

watch(() => props.refreshIncrement, () => {
  refresh()
})

watch(() => props.fetchIncrement, () => {
  fetch()
})

watch(() => props.fetchDetailIncrement, () => {
  fetchDetail()
})

onMounted(() => {
  ro = initResizeObserver()

  isHeightRead.value = true

  tryToParseJSON(route.query.filters as string)

  if (detailItemId.value) {
    fetchDetail()
  }

  fetch().then(() => {
    updateDimensions()
    isFirstLoading.value = false
  })
})

onUnmounted(() => {
  ro?.disconnect()
})
</script>

<template>
  <div class="browser">
    <BrowserControlPanel
        :header="props.header"
        :search-string="searchString"
        @update:search-string="searchStringUpdated"
        ref="controlPanelTemplateRef"
    >
      <template #control-panel-right>
        <slot name="control-panel-right" />
      </template>
    </BrowserControlPanel>
    <div
        v-if="isFirstLoading || loading"
        v-loading="true"
        class="browser__loader"
        :class="{'--active': isHeightRead}"
        :style="{height: tableHeight}"
    />
    <div class="browser__container" ref="browserContainerTemplateRef">
      <BrowserFilters
          @active-filters:change="onFilterChange"
          @active-filters:reset="onFiltersReset"
          :active-filters="activeFilters"
          :filters="filters"
          v-if="!isFirstLoading && !loading && filters.length"
          :is-loading="false"
          :height="tableHeight"
      />
      <div class="browser__table-container" :style="{height: tableHeight}">
        <div class="browser__table-wrapper">
          <el-table
              @selection-change="onSelectionChange"
              @row-click="onRowClick"
              :default-sort="sortURL"
              :scrollbar-always-on="true"
              v-if="!isFirstLoading && !loading"
              :class="{'--loading': isFetching}"
              :style="{width: tableWidth}"
              @sort-change="onSortChange"
              :data="data"
              :max-height="tableHeight"
              :height="tableHeight"
          >
            <template v-for="column in tableColumns" :key="column.key || column.props?.prop">
              <component :is="column" />
            </template>
          </el-table>
        </div>
        <el-pagination
            v-if="!isFirstLoading && !loading"
            class="--browser"
            v-model:current-page="page"
            v-model:page-size="perPage"
            :page-sizes="props.perPageSizes"
            :disabled="false"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="onPageSizeChange"
            @current-change="onPageChange"
        />
      </div>
    </div>
  </div>
  <BrowserDetail
      :item="detailItem"
      :is-open="detailIsOpen"
      @update:is-open="onUpdateDetailIsOpen"
  >
    <template #detail-header>
      <slot name="detail-header" v-if="detailItem" :item="detailItem" />
    </template>
    <template #detail-content>
      <slot name="detail-content" />
    </template>
  </BrowserDetail>
</template>
