<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import BlockquoteExtension from '@tiptap/extension-blockquote'
import BoldExtension from '@tiptap/extension-bold'
import CodeExtension from '@tiptap/extension-code'
import CodeBlockExtension from '@tiptap/extension-code-block'
import DocumentExtension from '@tiptap/extension-document'
import HardBreakExtension from '@tiptap/extension-hard-break'
import HeadingExtension, { type Level } from '@tiptap/extension-heading'
import HorizontalRuleExtension from '@tiptap/extension-horizontal-rule'
import ItalicExtension from '@tiptap/extension-italic'
import LinkExtension from '@tiptap/extension-link'
import ParagraphExtension from '@tiptap/extension-paragraph'
import StrikeExtension from '@tiptap/extension-strike'
import TextExtension from '@tiptap/extension-text'
import UnderlineExtension from '@tiptap/extension-underline'
import TextAlignExtension from '@tiptap/extension-text-align'
import ImageExtension from '@tiptap/extension-image'
import {
  BulletList as BulletListExtension,
  ListItem as ListItemExtension,
  ListKeymap as ListKeymapExtension,
  OrderedList as OrderedListExtension
} from '@tiptap/extension-list'
import {
  Dropcursor as DropcursorExtension,
  Gapcursor as GapcursorExtension,
  TrailingNode as TrailingNodeExtension,
  UndoRedo as UndoRedoExtension
} from '@tiptap/extensions'
import {
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatStrikethrough,
  mdiCodeBraces,
  mdiFormatClear,
  mdiFormatListBulleted,
  mdiFormatListNumbered,
  mdiCodeBlockTags,
  mdiFormatQuoteClose,
  mdiMinus,
  mdiArrowDownBoldBoxOutline,
  mdiUndo,
  mdiRedo,
  mdiLink,
  mdiImagePlus,
  mdiFormatAlignLeft,
  mdiFormatAlignCenter,
  mdiFormatAlignRight,
  mdiFormatAlignJustify,
} from '@mdi/js'
import { computed, useTemplateRef, watch, unref, onBeforeUnmount } from 'vue'
import { type Content, getAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Fragment, Node } from '@tiptap/pm/model'
import { useModal } from "vue-final-modal";
import SetLinkModal from "./SetLinkModal.vue";
import SetImageModal from "./SetImageModal.vue";
import type { SetLinkFormData } from './index'
import { getMarkRange } from '@tiptap/core'
import { ArrowDown } from '@element-plus/icons-vue'
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useEditor } from '#imports'

interface ImageAttrs {
  src: string
  alt?: string | null
  title?: string | null
  'data-id'?: string | null
}

type TextAlign = 'left' | 'center' | 'right' | 'justify'

const props = defineProps<{
  modelValue?: string,
  imagesIdsToDelete?: number[],
  image: {
    entity_id: number,
    entity_type: string,
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [string],
  'update:imagesIdsToDelete': [number[]]
}>()

const scrollTemplateRef = useTemplateRef('scrollTemplateRef')

let imagesIdsToDelete: number[] = []

watch(() => props.imagesIdsToDelete, (v) => {
  if (v) {
    imagesIdsToDelete = v
  }
})

const currentTextAlign = computed<TextAlign>(() => {
  if (editor.value?.isActive({ textAlign: 'center' })) return 'center'
  if (editor.value?.isActive({ textAlign: 'right' })) return 'right'
  if (editor.value?.isActive({ textAlign: 'justify' })) return 'justify'
  return 'left'
})

const currentBlock = computed(() => {
  if (editor.value?.isActive('heading', { level: 1 })) return 'Header 1'
  if (editor.value?.isActive('heading', { level: 2 })) return 'Header 2'
  if (editor.value?.isActive('heading', { level: 3 })) return 'Header 3'
  if (editor.value?.isActive('heading', { level: 4 })) return 'Header 4'
  if (editor.value?.isActive('heading', { level: 5 })) return 'Header 5'
  if (editor.value?.isActive('heading', { level: 6 })) return 'Header 6'
  return 'Paragraph'
})

const textAlignOptions: {
  value: TextAlign
  label: string
  icon: string
}[] = [
  { value: 'left', label: 'Left', icon: mdiFormatAlignLeft },
  { value: 'center', label: 'Center', icon: mdiFormatAlignCenter },
  { value: 'right', label: 'Right', icon: mdiFormatAlignRight },
  { value: 'justify', label: 'Justify', icon: mdiFormatAlignJustify },
]

const setParagraph = () => {
  editor.value?.chain().focus().clearNodes().run()
}

const setHeading = (level: Level) => {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

const setTextAlign = (align: TextAlign) => {
  editor.value
      ?.chain()
      .focus()
      .setTextAlign(align)
      .run()
}

const updateDimensions = () => {
  const scrollInstance = scrollTemplateRef.value!
  const scrollEl = scrollInstance.getElement()!

  const rect = scrollEl.getBoundingClientRect()

  scrollEl.style.maxHeight = `${window.innerHeight - rect.top - 40}px`
}

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
      BoldExtension,
      BlockquoteExtension,
      BulletListExtension,
      CodeExtension,
      CodeBlockExtension,
      DocumentExtension,
      DropcursorExtension,
      GapcursorExtension,
      HardBreakExtension,
      HeadingExtension,
      UndoRedoExtension,
      HorizontalRuleExtension,
      ItalicExtension,
      ListItemExtension,
      ListKeymapExtension,
      OrderedListExtension,
      ParagraphExtension,
      StrikeExtension,
      TextExtension,
      UnderlineExtension,
      TrailingNodeExtension,
      ImageExtension.extend({
        /** @ts-ignore */
        addOptions() {
          return {
            ...this.parent?.(),
            onDelete: (_attrs: ImageAttrs) => {},
          }
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            'data-id': {
              default: undefined,
              parseHTML: el => el.getAttribute('data-id'),
              renderHTML: attrs => {
                if (!attrs['data-id']) {
                  return {}
                }

                return {
                  'data-id': attrs['data-id']
                }
              }
            },
          }
        },
        addProseMirrorPlugins() {
          return [
            new Plugin({
              /** @ts-ignore */
              appendTransaction: (transactions, oldState, newState) => {
                if (!transactions.some(tr => tr.docChanged)) return;

                const oldImageIds = new Set<string>();
                const newImageIds = new Set<string>();

                oldState.doc.descendants(node => {
                  if (node.type.name === this.name && node.attrs['data-id']) {
                    oldImageIds.add(node.attrs['data-id']);
                  }
                });

                newState.doc.descendants(node => {
                  if (node.type.name === this.name && node.attrs['data-id']) {
                    newImageIds.add(node.attrs['data-id']);
                  }
                });

                oldImageIds.forEach(id => {
                  if (!newImageIds.has(id)) {
                    /** @ts-ignore */
                    this.options.onDelete?.({ 'data-id': id } as ImageAttrs);
                  }
                });

                newImageIds.forEach(id => {
                  if (!oldImageIds.has(id)) {
                    console.log('Image restored:', id);
                    /** @ts-ignore */
                    this.options.onRestore?.({ 'data-id': id } as ImageAttrs);
                  }
                });
              },
            }),
          ]
        }
      }).configure({
        /** @ts-ignore */
        onDelete: async (attrs: ImageAttrs) => {
          if (attrs['data-id']) {
            imagesIdsToDelete.push(Number(attrs['data-id']))
            emit('update:imagesIdsToDelete', imagesIdsToDelete)
          }
        },
        onRestore: (attrs: ImageAttrs) => {
          if (attrs['data-id']) {
            imagesIdsToDelete = imagesIdsToDelete.filter(id => id !== Number(attrs['data-id']));
            emit('update:imagesIdsToDelete', imagesIdsToDelete);
          }
        }
      }),
      TextAlignExtension.configure({
        types: ['heading', 'paragraph'],
      }),
      LinkExtension.extend({
        inclusive: false,
        addAttributes() {
          return {
            ...this.parent?.(),
            title: {
              default: '"ctrl+click" для открытия ссылки'
            }
          }
        },
        addProseMirrorPlugins() {
          const plugins: Plugin[] = this.parent?.() || [];

          const ctrlClickHandler = new Plugin({
            key: new PluginKey('handleControlClick'),
            props: {
              handleClick(view, pos, event) {
                const attrs = getAttributes(view.state, 'link')
                const link = (event.target as HTMLElement)?.closest('a')
                const keyPressed = event.ctrlKey || event.metaKey;

                if (keyPressed && link && attrs.href) {
                  window.open(attrs.href, '_blank');

                  return true;
                }

                return false;
              }
            }
          });

          plugins.push(ctrlClickHandler);

          return plugins
        }
      }).configure({openOnClick: false}),
  ],
  onCreate() {
    updateDimensions()

    window.addEventListener('resize', updateDimensions, { passive: true});
  },
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  }
});

const onClickSetLink = async () => {

  editor.value!.chain().blur()

  const { state, view } = editor.value!

  /** получаем node в которой находится наш курсор */
  const node = view.state.doc.nodeAt(state.selection.$from.pos)

  let inNewWindow
  let text: string | undefined = state.doc.textBetween(state.selection.from, state.selection.to)
  let link
  let from = state.selection!.from
  let to = state.selection!.to

  /** определяем есть ли ссылки в этой node */
  if (node?.marks) {
    const linkMark = node.marks.find(mark => mark.type.name === 'link');

    if (linkMark) {
      inNewWindow = linkMark.attrs.target && linkMark.attrs.target === '_blank';
      link = linkMark.attrs.href;
      text = node.text

      const range = getMarkRange(state.selection.$from, linkMark.type)

      from = range!.from
      to = range!.to
    }
  }

  const modal = useModal({
    component: SetLinkModal,
    attrs: {
      link,
      inNewWindow,
      text: text || '',
      onSubmit: async (value: SetLinkFormData) => {
        await modal.close()

        editor.value!.chain()
            .focus()
            .setTextSelection({from, to})
            .insertContent({
              type: 'text',
              text: value.text,
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: value.link,
                    target: value.inNewWindow ? '_blank' : '_self',
                  }
                }
              ]
            })
            .run()
      },
      onClose: () => {
        modal.close()
      }
    }
  })

  await modal.open()
}

const onClickUploadImage = async () => {

  editor.value!.chain().blur()

  const modal = useModal({
    component: SetImageModal,
    attrs: {
      entity_id: props.image.entity_id,
      entity_type: props.image.entity_type,
      onSubmit: async (v: {id?: number, url: string}) => {
        await modal.close()

        editor.value!.chain()
            .setImage({
              src: v.url,
              /** @ts-ignore */
              'data-id': v.id
            })
            .focus()
            .run()
      },
      onClose: () => {
        modal.close()
      }
    }
  })

  await modal.open()
}

watch(() => props.modelValue, (newValue: Content | Fragment | Node ) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDimensions);
  unref(editor)?.destroy();
});
</script>

<template>
  <div class="rich-editor" :class="{'--loading': !editor}">
    <div v-if="editor" class="rich-editor__top-container">
      <div class="rich-editor__buttons-group form__rich-editor-group-buttons">
        <el-dropdown trigger="click">
          <el-button>
            {{ currentBlock }}
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                  :class="{ 'is-active': currentBlock === 'Paragraph' }"
                  @click="setParagraph"
              >
                Paragraph
              </el-dropdown-item>

              <el-dropdown-item
                  v-for="level in 6"
                  :key="level"
                  :class="{ 'is-active': currentBlock === `H${level}` }"
                  @click="setHeading(level as Level)"
              >
                Header {{ level }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click">
          <el-button>
            <svg viewBox="0 0 24 24">
              <path
                  :d="textAlignOptions.find(o => o.value === currentTextAlign)?.icon"
              />
            </svg>
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>

          <template #dropdown>
            <el-dropdown-menu class="rich-editor__dropdown">
              <el-dropdown-item
                  v-for="option in textAlignOptions"
                  :key="option.value"
                  :class="{ 'is-active': currentTextAlign === option.value }"
                  @click="setTextAlign(option.value)"
              >
                <svg viewBox="0 0 24 24">
                  <path :d="option.icon" />
                </svg>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
            @click="onClickUploadImage"
            :disabled="!editor.can().chain().focus().setImage({src: ''})"
            :class="{ 'is-active': editor.isActive('image') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiImagePlus" />
          </svg>
        </el-button>
        <el-button
            @click="onClickSetLink"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiLink" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleBold().run()"
            :disabled="!editor.can().chain().focus().toggleBold().run()"
            :class="{ 'is-active': editor.isActive('bold') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatBold" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleItalic().run()"
            :disabled="!editor.can().chain().focus().toggleItalic().run()"
            :class="{ 'is-active': editor.isActive('italic') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatItalic" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleStrike().run()"
            :disabled="!editor.can().chain().focus().toggleStrike().run()"
            :class="{ 'is-active': editor.isActive('strike') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatStrikethrough" />
          </svg>
        </el-button>
        <el-button @click="editor.chain().focus().unsetAllMarks().run()">
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatClear" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleBulletList().run()"
            :class="{ 'is-active': editor.isActive('bulletList') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatListBulleted" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleOrderedList().run()"
            :class="{ 'is-active': editor.isActive('orderedList') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatListNumbered" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleBlockquote().run()"
            :class="{ 'is-active': editor.isActive('blockquote') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiFormatQuoteClose" />
          </svg>
        </el-button>
        <el-button @click="editor.chain().focus().setHorizontalRule().run()">
          <svg viewBox="0 0 24 24">
            <path :d="mdiMinus" />
          </svg>
        </el-button>
        <el-button @click="editor.chain().focus().setHardBreak().run()">
          <svg viewBox="0 0 24 24">
            <path :d="mdiArrowDownBoldBoxOutline" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleCode().run()"
            :disabled="!editor.can().chain().focus().toggleCode().run()"
            :class="{ 'is-active': editor.isActive('code') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiCodeBraces" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().toggleCodeBlock().run()"
            :class="{ 'is-active': editor.isActive('codeBlock') }"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiCodeBlockTags" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().undo().run()"
            :disabled="!editor.can().chain().focus().undo().run()"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiUndo" />
          </svg>
        </el-button>
        <el-button
            @click="editor.chain().focus().redo().run()"
            :disabled="!editor.can().chain().focus().redo().run()"
        >
          <svg viewBox="0 0 24 24">
            <path :d="mdiRedo" />
          </svg>
        </el-button>
      </div>
      <div>
        <slot />
      </div>
    </div>
    <OverlayScrollbarsComponent class="rich-editor__custom-scroll" ref="scrollTemplateRef">
      <EditorContent :editor="editor" />
    </OverlayScrollbarsComponent>
  </div>
</template>
