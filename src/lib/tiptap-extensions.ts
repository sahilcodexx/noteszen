import { Node, Mark, Extension, mergeAttributes, InputRule } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import React, { useEffect, useRef } from 'react'

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

async function getMermaid() {
  const mermaid = await (mermaidPromise ??= import('mermaid').then((mod) => mod.default))
  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
    mermaidInitialized = true
  }
  return mermaid
}
let mermaidInitialized = false

export const Wikilink = Mark.create({
  name: 'wikilink',
  inclusive: false,
  addAttributes() {
    return {
      title: { default: null },
      noteId: { default: null },
      exists: { default: 'true' },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-wikilink]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const exists = HTMLAttributes.exists !== 'false'
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wikilink': '',
        class: exists
          ? 'wikilink wikilink-exists cursor-pointer'
          : 'wikilink wikilink-missing cursor-pointer',
      }),
      0,
    ]
  },
  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ range, match, chain }) => {
          const title = match[1]
          chain()
            .deleteRange(range)
            .insertContent({
              type: 'text',
              text: `[[${title}]]`,
              marks: [{ type: this.name, attrs: { title, exists: 'true' } }],
            })
            .run()
        },
      }),
    ]
  },
})

const wikilinkDecorationsKey = new PluginKey('wikilinkDecorations')

export function createWikilinkExtension(resolveNoteId: (title: string) => string | null) {
  return Extension.create({
    name: 'wikilinkDecorations',
    addProseMirrorPlugins() {
      return [createWikilinkDecorationPlugin(resolveNoteId)]
    },
  })
}

function createWikilinkDecorationPlugin(
  resolveNoteId: (title: string) => string | null
) {
  return new Plugin({
    key: wikilinkDecorationsKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = []
        const regex = /\[\[([^\]]+)\]\]/g
        state.doc.descendants((node, pos) => {
          if (!node.isText) return
          const text = node.text || ''
          let match: RegExpExecArray | null
          while ((match = regex.exec(text)) !== null) {
            const title = match[1]
            const noteId = resolveNoteId(title)
            const from = pos + match.index
            const to = from + match[0].length
            decorations.push(
              Decoration.inline(from, to, {
                class: noteId
                  ? 'wikilink wikilink-exists cursor-pointer'
                  : 'wikilink wikilink-missing cursor-pointer',
                'data-wikilink-title': title,
                'data-wikilink-id': noteId || '',
              })
            )
          }
        })
        return DecorationSet.create(state.doc, decorations)
      },
      handleClick(view, pos) {
        const doc = view.state.doc
        const $pos = doc.resolve(pos)
        const node = $pos.parent.childAfter($pos.parentOffset)
        if (!node.node?.isText) return false
        const text = node.node.text || ''
        const offset = node.offset
        const regex = /\[\[([^\]]+)\]\]/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(text)) !== null) {
          const from = $pos.start() + offset + match.index
          const to = from + match[0].length
          if (pos >= from && pos <= to) {
            const title = match[1]
            const noteId = resolveNoteId(title)
            if (noteId) {
              window.dispatchEvent(
                new CustomEvent('noteszen:wikilink-click', { detail: { noteId, title } })
              )
              return true
            }
            window.dispatchEvent(
              new CustomEvent('noteszen:wikilink-create', { detail: { title } })
            )
            return true
          }
        }
        return false
      },
    },
  })
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      variant: { default: 'info' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const variant = HTMLAttributes.variant || 'info'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        class: `callout callout-${variant}`,
      }),
      0,
    ]
  },
})

function MermaidBlockView({ node }: { node: { textContent: string } }) {
  const ref = useRef<HTMLDivElement>(null)
  const code = node.textContent

  useEffect(() => {
    if (!ref.current || !code.trim()) return
    let cancelled = false
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
    getMermaid()
      .then((mermaid) => mermaid.render(id, code.trim()))
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
      .catch(() => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre class="text-xs text-destructive p-2">Invalid mermaid diagram</pre>`
        }
      })
    return () => {
      cancelled = true
    }
  }, [code])

  return React.createElement(
    NodeViewWrapper,
    { className: 'mermaid-block my-4' },
    React.createElement('div', { ref, className: 'flex justify-center overflow-x-auto p-2' })
  )
}

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  content: 'text*',
  code: true,
  defining: true,
  marks: '',
  addAttributes() {
    return { language: { default: 'mermaid' } }
  },
  parseHTML() {
    return [{ tag: 'pre[data-language="mermaid"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(HTMLAttributes, { 'data-language': 'mermaid' }), ['code', 0]]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlockView)
  },
})

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (el) => el.getAttribute('width') || el.style.width || '100%',
        renderHTML: (attrs) => ({ width: attrs.width, style: `width: ${attrs.width}` }),
      },
      alt: {
        default: null,
        parseHTML: (el) => el.getAttribute('alt'),
        renderHTML: (attrs) => (attrs.alt ? { alt: attrs.alt } : {}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute('title'),
        renderHTML: (attrs) => (attrs.title ? { title: attrs.title } : {}),
      },
    }
  },
})
