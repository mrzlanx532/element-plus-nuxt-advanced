import { defineNuxtPlugin } from '#app'
import { vMaska } from 'maska/vue'

export default defineNuxtPlugin((_nuxtApp) => {
  _nuxtApp.vueApp.directive('maska', vMaska)
})
