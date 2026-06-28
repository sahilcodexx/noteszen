import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import nspell from 'nspell'

const AFF_URL = '/dictionaries/en/index.aff'
const DIC_URL = '/dictionaries/en/index.dic'

type SpellChecker = ReturnType<typeof nspell>

const WORD_PATTERN = /[A-Za-z']+/g
const SPELLCHECK_KEY = new PluginKey('spellcheck')

let checkerPromise: Promise<SpellChecker | null> | null = null

async function loadChecker(): Promise<SpellChecker | null> {
  if (!checkerPromise) {
    checkerPromise = (async () => {
      try {
        const [affRes, dicRes] = await Promise.all([fetch(AFF_URL), fetch(DIC_URL)])
        if (!affRes.ok || !dicRes.ok) return null
        const aff = await affRes.text()
        const dic = await dicRes.text()
        return nspell(aff, dic)
      } catch {
        return null
      }
    })()
  }
  return checkerPromise
}

function shouldSkipNode(node: ProseMirrorNode): boolean {
  const name = node.type.name
  return name === 'codeBlock' || name === 'mermaid' || name === 'image'
}

function buildDecorations(doc: ProseMirrorNode, checker: SpellChecker): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (shouldSkipNode(node)) return false
    if (!node.isText || !node.text) return

    const text = node.text
    WORD_PATTERN.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = WORD_PATTERN.exec(text)) !== null) {
      const word = match[0]
      if (word.length < 2) continue
      if (!/[A-Za-z]/.test(word)) continue
      if (checker.correct(word)) continue

      const from = pos + match.index
      const to = from + word.length
      decorations.push(
        Decoration.inline(from, to, {
          class: 'spellcheck-error',
          title: `"${word}" is not a word`,
        })
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}

function dispatchDecorations(view: EditorView, checker: SpellChecker) {
  const decorations = buildDecorations(view.state.doc, checker)
  const tr = view.state.tr.setMeta(SPELLCHECK_KEY, { decorations })
  view.dispatch(tr)
}

function createSpellcheckPlugin() {
  let checker: SpellChecker | null = null
  let timeout: ReturnType<typeof setTimeout> | undefined

  void loadChecker().then((loaded) => {
    checker = loaded
  })

  const scheduleCheck = (view: EditorView) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (!checker) return
      dispatchDecorations(view, checker)
    }, 200)
  }

  return new Plugin({
    key: SPELLCHECK_KEY,
    state: {
      init: () => DecorationSet.empty,
      apply(tr: Transaction, decorationSet: DecorationSet) {
        const meta = tr.getMeta(SPELLCHECK_KEY) as { decorations?: DecorationSet } | undefined
        if (meta?.decorations) return meta.decorations
        if (tr.docChanged) return decorationSet.map(tr.mapping, tr.doc)
        return decorationSet
      },
    },
    view(view: EditorView) {
      void loadChecker().then((loaded) => {
        checker = loaded
        if (checker) dispatchDecorations(view, checker)
      })

      return {
        update(updatedView: EditorView, prevState: EditorState) {
          if (!prevState.doc.eq(updatedView.state.doc)) {
            scheduleCheck(updatedView)
          }
        },
        destroy() {
          if (timeout) clearTimeout(timeout)
        },
      }
    },
    props: {
      decorations(state: EditorState) {
        return SPELLCHECK_KEY.getState(state) ?? DecorationSet.empty
      },
    },
  })
}

export function createSpellcheckExtension() {
  return Extension.create({
    name: 'spellcheck',
    addProseMirrorPlugins() {
      return [createSpellcheckPlugin()]
    },
  })
}