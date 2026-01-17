import { type Component, type Ref, ref, shallowRef, watch, markRaw } from 'vue'

export interface ITabItem {
    title: string,
    component: Component,
    formDataKeys?: Set<string> | string[]
    hasError?: boolean
}

export const useTabs = () => {
  const selectedTab = ref(0)

  const initTabs = (_tabs: ITabItem[], errors?: Ref<{[key: string]: string[]}>) => {
    const tabs = ref(
      _tabs.map((_tab) => {
        const tab = {
          ..._tab,
          component: markRaw(_tab.component)
        }

        if (_tab.formDataKeys && !(_tab.formDataKeys instanceof Set)) {
          tab.formDataKeys = markRaw(new Set(_tab.formDataKeys))
        }

        return tab
      })
    )

    const selectedTabComponent = initSelectedTabComponent(tabs)
    watchSelectedTab(tabs, selectedTabComponent)

    if (errors) {
      watch(errors, (_errors) => {
        tabs.value.map((tab) => {
          tab.hasError = false
          return tab
        })

        for (const _errorsKey in _errors) {
          for (const tabKey in tabs.value) {
            if (tabs.value[tabKey]!.formDataKeys instanceof Set && tabs.value[tabKey]!.formDataKeys.has(_errorsKey)) {
                            tabs.value[tabKey]!.hasError = true
            }
          }
        }
      }, {
        deep: true
      })
    }

    return {
      tabs,
      selectedTabComponent,
      selectedTab
    }
  }

  const initSelectedTabComponent = (tabs: Ref<ITabItem[]>) => {
    return shallowRef(tabs.value[selectedTab.value]!.component)
  }

  const watchSelectedTab = (tabs: Ref<ITabItem[]>, selectedTabComponent: ReturnType<typeof initSelectedTabComponent>) => {
    watch(
      selectedTab,
      () => {
        selectedTabComponent.value = tabs.value[selectedTab.value]!.component
      }
    )
  }

  return {
    initTabs
  }
}
