'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useState } from 'react'

/* --- Toolbar button --- */
function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-lg transition-colors text-sm leading-none ${
        active
          ? 'bg-teal-100 text-teal-700'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

/* --- SVG icons (inline, no extra dep) --- */
const Icon = {
  Bold: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  Italic: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  Underline: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  ),
  BulletList: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  OrderedList: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
      <text x="2" y="9" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1.</text>
      <text x="2" y="15" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">2.</text>
      <text x="2" y="21" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">3.</text>
    </svg>
  ),
  AlignLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  ),
  AlignCenter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
  H2: () => (
    <svg width="16" height="14" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="1" x2="3" y2="17" /><line x1="3" y1="9" x2="12" y2="9" /><line x1="12" y1="1" x2="12" y2="17" />
      <text x="15" y="17" fontSize="11" fill="currentColor" stroke="none" fontWeight="bold">2</text>
    </svg>
  ),
  H3: () => (
    <svg width="16" height="14" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="1" x2="3" y2="17" /><line x1="3" y1="9" x2="12" y2="9" /><line x1="12" y1="1" x2="12" y2="17" />
      <text x="15" y="17" fontSize="11" fill="currentColor" stroke="none" fontWeight="bold">3</text>
    </svg>
  ),
  Divider: () => <div className="w-px h-4 bg-slate-200 mx-0.5" />,
}

/* --- Main Component --- */
interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  editorClassName?: string
}

const normalizeListHtml = (html: string) => {
  if (typeof window === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('li').forEach((li) => {
    const parent = li.parentElement
    if (!parent) return

    const inner = li.innerHTML
    const hasLineBreaks = /<br\s*\/?>/i.test(inner)
    const hasBlockChildren = Array.from(li.children).some((child) => ['P', 'DIV', 'UL', 'OL', 'BLOCKQUOTE'].includes(child.tagName))
    if (!hasLineBreaks && !hasBlockChildren) return

    const parts = inner
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length <= 1) return

    const fragment = doc.createDocumentFragment()
    parts.forEach((part) => {
      const nextItem = doc.createElement('li')
      nextItem.innerHTML = part
      fragment.appendChild(nextItem)
    })

    parent.insertBefore(fragment, li)
    parent.removeChild(li)
  })

  return doc.body.innerHTML
}

const normalizeIncomingContent = (input: string) => {
  const raw = String(input ?? '').trim()
  if (!raw) return ''
  const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(raw)
  if (hasHtmlTag) return normalizeListHtml(raw)

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line}</p>`)
    .join('')
}

export default function RichTextEditor({ value, onChange, placeholder = 'Describe this product...', editorClassName }: RichTextEditorProps) {
  const [isEmpty, setIsEmpty] = useState(!value)

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: normalizeIncomingContent(value || ''),
    onUpdate({ editor }) {
      const html = editor.getHTML()
      const empty = editor.isEmpty
      setIsEmpty(empty)
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: `rich-content min-h-[100px] max-h-[220px] overflow-y-auto px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 ${editorClassName ?? ''}`.trim(),
      },
      handleKeyDown: (_view, event) => {
        if (event.key !== 'Enter' || !event.shiftKey) return false
        if (!editor.isActive('bulletList') && !editor.isActive('orderedList')) return false

        event.preventDefault()
        return editor.commands.splitListItem('listItem')
      },
    },
  })

  // Sync external value changes (e.g. when modal resets)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = normalizeIncomingContent(value || '')
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false })
      queueMicrotask(() => setIsEmpty(!incoming || incoming === '<p></p>'))
    }
  }, [value, editor])

  if (!editor) return null

  const applySmartList = (ordered: boolean) => {
    const { from, to, empty } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '\n')
    const lines = selectedText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length > 1) {
      const tag = ordered ? 'ol' : 'ul'
      const html = `<${tag}>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</${tag}>`
      editor.chain().focus().insertContentAt({ from, to }, html).run()
      return
    }

    if (empty) {
      const { $from } = editor.state.selection
      const blockFrom = $from.start()
      const blockTo = $from.end()
      const blockText = editor.state.doc.textBetween(blockFrom, blockTo, '\n')
      const blockLines = blockText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (blockLines.length > 1) {
        const tag = ordered ? 'ol' : 'ul'
        const html = `<${tag}>${blockLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</${tag}>`
        editor.chain().focus().insertContentAt({ from: blockFrom, to: blockTo }, html).run()
        return
      }
    }

    if (ordered) {
      editor.chain().focus().toggleOrderedList().run()
    } else {
      editor.chain().focus().toggleBulletList().run()
    }
  }

  const btn = (action: () => void, active: boolean, title: string, Icon: React.ComponentType) => (
    <ToolBtn onClick={action} active={active} title={title}><Icon /></ToolBtn>
  )

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-400 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50/70">
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'Bold', Icon.Bold)}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'Italic', Icon.Italic)}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'Underline', Icon.Underline)}
        <Icon.Divider />
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'Heading 2', Icon.H2)}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'Heading 3', Icon.H3)}
        <Icon.Divider />
        {btn(() => applySmartList(false), editor.isActive('bulletList'), 'Bullet List', Icon.BulletList)}
        {btn(() => applySmartList(true), editor.isActive('orderedList'), 'Numbered List', Icon.OrderedList)}
        <Icon.Divider />
        {btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), 'Align Left', Icon.AlignLeft)}
        {btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), 'Align Center', Icon.AlignCenter)}
      </div>

      <div className="relative">
        {isEmpty && (
          <p className="absolute top-2.5 left-3.5 text-sm text-slate-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
