import { addPluginTemplate, addTemplate, defineNuxtModule, createResolver, addImportsDir, addPlugin } from '@nuxt/kit'
import { defaults } from './config'
import {
  resolveCache,
  resolveComponents,
  resolveDirectives,
  resolveGlobalConfig,
  resolveBaseImports,
  resolveImports,
  resolveInjection,
  resolveOptions,
  resolveStyles,
  resolveTeleports,
  resolveThemeChalk,
  resolveThemes,
  resolveMethods,
  transformPlugin,
  localePlugin
} from './core/index'
import { getLayersDir } from './utils'
import type { ModuleOptions } from './types'
export type { ModuleOptions } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'backoffice-ui',
    configKey: 'backofficeUI',
    compatibility: {
      nuxt: '>=3'
    }
  },
  defaults,
  setup (options, nuxt) {
    const layers = getLayersDir(nuxt.options._layers)

    // disable the `cache` option when building applications
    if (!nuxt.options.dev) {
      options.cache = false
    }

    resolveOptions(options)
    resolveThemes(options)
    resolveBaseImports(options)
    nuxt.options.imports.autoImport !== false && resolveImports(options)
    nuxt.options.components !== false && resolveComponents(options)
    options.cache && addTemplate(resolveCache(options))
    options.globalConfig && addPluginTemplate(resolveGlobalConfig(options))
    options.importStyle === 'scss' && options.themeChalk && resolveThemeChalk(options).map(addTemplate)

    if (nuxt.options.ssr !== false) {
      addPluginTemplate(resolveInjection(options))
      addPluginTemplate(resolveTeleports(options))
      options.installMethods.length && addPluginTemplate(resolveMethods(options))
    }

    nuxt.hook('vite:extendConfig', (config, { isClient }) => {
      const mode = isClient ? 'client' : 'server'

      config.plugins = config.plugins || []
      config.plugins.push(transformPlugin.vite({
        layers,
        cache: options.cache,
        include: options.include,
        exclude: options.exclude,
        sourcemap: nuxt.options.sourcemap[mode],
        transformStyles: name => resolveStyles(options, name),
        transformDirectives: name => resolveDirectives(options, name)
      }))

      if (options.defaultLocale !== 'en') {
        config.plugins.push(localePlugin.vite({
          sourcemap: nuxt.options.sourcemap[mode],
          locale: options.defaultLocale
        }))
      }
    })

    nuxt.hook('webpack:config', (configs) => {
      configs.forEach((config) => {
        const mode = config.name === 'client' ? 'client' : 'server'

        config.plugins = config.plugins || []
        config.plugins.push(transformPlugin.webpack({
          layers,
          cache: options.cache,
          include: options.include,
          exclude: options.exclude,
          sourcemap: nuxt.options.sourcemap[mode],
          transformStyles: name => resolveStyles(options, name),
          transformDirectives: name => resolveDirectives(options, name)
        }))

        if (options.defaultLocale !== 'en') {
          config.plugins.push(localePlugin.webpack({
            sourcemap: nuxt.options.sourcemap[mode],
            locale: options.defaultLocale
          }))
        }
      })
    })

    /** Advanced */
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.alias['#backoffice-ui'] = resolve('./runtime')
    nuxt.options.css.push(resolve('./runtime/assets/css/style.css'))

    addImportsDir(resolve('./runtime/composables'))
    addPlugin(resolve('./runtime/plugin'))
  },
  moduleDependencies: {
    'nuxt-tiptap-editor': {
      version: '3.2.0'
    },
    '@vue-final-modal/nuxt': {
      version: '1.0.3'
    },
    '@mrzlanx532/nuxt-3-laravel-auth-module': {
      version: '0.0.31'
    }
  }
})
