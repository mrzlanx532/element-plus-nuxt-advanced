<script setup lang="ts">
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import { ref, useTemplateRef, type Component } from 'vue'
import { type ElMenu } from 'element-plus'
import { useRouter, useRoute } from '#imports'

interface MenuItemPlain {
  name: string
  link: string,
  icon?: Component
}

interface MenuItemWithChildren {
  name: string,
  link: string,
  icon?: Component
  children: MenuItemPlain[]
}

export type MenuItem = MenuItemPlain | MenuItemWithChildren

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  items: MenuItem[],
  height?: string
}>()

const lastActiveSubMenuIndex = ref()

const menuTemplateRef = useTemplateRef<typeof ElMenu>('menuTemplateRef')

const onClickLink = (menuItemPlain: MenuItemPlain) => {
  router.push(menuItemPlain.link)
}

const isMenuItemPlain = (item: any): item is MenuItemPlain => {
  return !('children' in item)
}

const isMenuItemWithChildren = (item: any): item is MenuItemWithChildren => {
  return 'children' in item
}

const closeActive = () => {
  menuTemplateRef.value!.close(lastActiveSubMenuIndex.value)
}

const onOpenSubMenu = (index: string) => {
  lastActiveSubMenuIndex.value = index
}

defineExpose({
  closeActive
})
</script>

<template>
  <el-menu router :default-active="route.path" @open="onOpenSubMenu" class="sidebar__menu" :unique-opened="true" ref="menuTemplateRef">
    <OverlayScrollbarsComponent :options="{scrollbars: {theme: 'os-theme-default'}}" :style="{height: props.height}">
      <template v-for="(menuItem, i) in props.items">
        <el-menu-item v-if="isMenuItemPlain(menuItem)" @click="onClickLink(menuItem)" :index="menuItem.link">
          <el-icon>
            <component v-if="menuItem.icon" :is="menuItem.icon" />
          </el-icon>
          <span>{{ menuItem.name }}</span>
        </el-menu-item>
        <el-sub-menu v-if="isMenuItemWithChildren(menuItem)" class="sidebar__sub-menu" :index="menuItem.link" >
          <template #title>
            <el-icon>
              <component v-if="menuItem.icon" :is="menuItem.icon" />
            </el-icon>
            <span>{{ menuItem.name }}</span>
          </template>
          <template #default>
            <el-menu-item @click="onClickLink(menuItemChild)" v-for="menuItemChild in menuItem.children" :index="menuItemChild.link">
              <el-icon>
                <component v-if="menuItemChild.icon" :is="menuItemChild.icon" />
              </el-icon>
              <span>{{ menuItemChild.name }}</span>
            </el-menu-item>
          </template>
        </el-sub-menu>
      </template>
    </OverlayScrollbarsComponent>
  </el-menu>
</template>
