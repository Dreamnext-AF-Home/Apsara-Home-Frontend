'use client'

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  Quote,
  Smile,
  Strikethrough,
  Trash2,
  Underline,
} from 'lucide-react'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'

export default function AnnouncementsClient() {
  const [channels, setChannels] = useState({ email: true, sms: false })
  const [title, setTitle] = useState('')
  const initialContentHtml =
    '<p>Hi {{customer_name}},</p><h2>Mega Sale Starts Tonight!</h2><p>Get ready for our biggest sale of the month!</p><p>Sale starts tonight at 12:00 AM.<br/>Shop now before stocks run out!</p>'
  const maxTitleLength = 100
  const editorRef = useRef<HTMLDivElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const selectionRangeRef = useRef<Range | null>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [hasSelectedImage, setHasSelectedImage] = useState(false)
  const [fontSize, setFontSize] = useState('14')
  const [fontFamily, setFontFamily] = useState('Arial')

  const toolbarButtonClass =
    'grid h-8 w-8 place-items-center rounded-md border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700'
  const saveSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return
    const range = selection.getRangeAt(0)
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRangeRef.current = range.cloneRange()
    }
  }

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (!selection || !selectionRangeRef.current) return
    selection.removeAllRanges()
    selection.addRange(selectionRangeRef.current)
  }

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    restoreSelection()
    const ok = document.execCommand(command, false, value)
    if (!ok && (command === 'insertUnorderedList' || command === 'insertOrderedList')) {
      const listTag = command === 'insertUnorderedList' ? 'ul' : 'ol'
      document.execCommand('insertHTML', false, `<${listTag}><li><br></li></${listTag}><p><br></p>`)
    }
    saveSelection()
    const text = editorRef.current?.textContent?.trim() ?? ''
    setCharacterCount(text.length)
    setWordCount(text ? text.split(/\s+/).length : 0)
  }

  const runListCommand = (command: 'insertUnorderedList' | 'insertOrderedList') => {
    runCommand(command)
  }

  const applyFontSize = (sizePx: string) => {
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand('fontSize', false, '7')
    if (!editorRef.current) return
    const fontTags = editorRef.current.querySelectorAll('font[size="7"]')
    fontTags.forEach((tag) => {
      tag.removeAttribute('size')
      ;(tag as HTMLElement).style.fontSize = `${sizePx}px`
    })
    saveSelection()
    const text = editorRef.current.textContent?.trim() ?? ''
    setCharacterCount(text.length)
    setWordCount(text ? text.split(/\s+/).length : 0)
  }

  const handleInsertImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    restoreSelection()
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result ?? '')
      if (src) {
        const html = `<img src="${src}" alt="Announcement image" style="max-width:220px;width:auto;height:auto;display:block;border-radius:8px;border:1px solid #e2e8f0;margin:12px 0;" />`
        runCommand('insertHTML', html)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerHTML = initialContentHtml
    const text = editorRef.current.textContent?.trim() ?? ''
    setCharacterCount(text.length)
    setWordCount(text ? text.split(/\s+/).length : 0)
  }, [])

  const clearImageSelection = () => {
    if (!editorRef.current) return
    const selected = editorRef.current.querySelectorAll('img[data-selected="true"]')
    selected.forEach((img) => {
      img.removeAttribute('data-selected')
      ;(img as HTMLImageElement).style.outline = 'none'
    })
    setHasSelectedImage(false)
  }

  const removeSelectedImage = () => {
    if (!editorRef.current) return
    const selected = editorRef.current.querySelector('img[data-selected="true"]')
    if (selected) {
      selected.remove()
      setHasSelectedImage(false)
      const text = editorRef.current.textContent?.trim() ?? ''
      setCharacterCount(text.length)
      setWordCount(text ? text.split(/\s+/).length : 0)
    }
  }

  return (
    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2 md:p-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">1. Channel</h2>
          <p className="text-sm text-slate-500">Choose where you want to send this announcement.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label
              htmlFor="announcement-channel-email"
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                channels.email ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 bg-white'
              }`}
            >
              <input
                id="announcement-channel-email"
                type="checkbox"
                checked={channels.email}
                onChange={(event) => setChannels((prev) => ({ ...prev, email: event.target.checked }))}
                className="sr-only"
              />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <Mail className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">Email</span>
                <span className="block text-sm text-slate-500">Send via email</span>
              </span>
              <span className={`h-5 w-5 rounded-full border-2 ${channels.email ? 'border-indigo-600' : 'border-slate-300'}`}>
                <span className={`m-[3px] block h-2.5 w-2.5 rounded-full ${channels.email ? 'bg-indigo-600' : 'bg-transparent'}`} />
              </span>
            </label>

            <label
              htmlFor="announcement-channel-sms"
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                channels.sms ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 bg-white'
              }`}
            >
              <input
                id="announcement-channel-sms"
                type="checkbox"
                checked={channels.sms}
                onChange={(event) => setChannels((prev) => ({ ...prev, sms: event.target.checked }))}
                className="sr-only"
              />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">SMS</span>
                <span className="block text-sm text-slate-500">Send via SMS</span>
              </span>
              <span className={`h-5 w-5 rounded-full border-2 ${channels.sms ? 'border-indigo-600' : 'border-slate-300'}`}>
                <span className={`m-[3px] block h-2.5 w-2.5 rounded-full ${channels.sms ? 'bg-indigo-600' : 'bg-transparent'}`} />
              </span>
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">2. Announcement Title</h2>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, maxTitleLength))}
              placeholder="Enter announcement title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {title.length}/{maxTitleLength}
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">3. Content</h2>
          <p className="text-sm text-slate-500">Create your announcement content. You can format text, add images, buttons and more.</p>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
              <button type="button" className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-slate-700 hover:bg-slate-100">
                Paragraph <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <label className="ml-1 flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600">
                <select
                  value={fontFamily}
                  onChange={(event) => {
                    setFontFamily(event.target.value)
                    runCommand('fontName', event.target.value)
                  }}
                  className="bg-transparent outline-none"
                >
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                </select>
              </label>
              <label className="ml-1 flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600">
                <select
                  value={fontSize}
                  onChange={(event) => {
                    setFontSize(event.target.value)
                    applyFontSize(event.target.value)
                  }}
                  className="bg-transparent outline-none"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="24">24</option>
                  <option value="28">28</option>
                  <option value="32">32</option>
                  <option value="36">36</option>
                  <option value="40">40</option>
                  <option value="50">50</option>
                </select>
              </label>
              <button type="button" onClick={() => runCommand('bold')} className={toolbarButtonClass}><Bold className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('italic')} className={toolbarButtonClass}><Italic className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('underline')} className={toolbarButtonClass}><Underline className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('strikeThrough')} className={toolbarButtonClass}><Strikethrough className="h-4 w-4" /></button>
              <button type="button" onClick={() => runListCommand('insertUnorderedList')} className={toolbarButtonClass}><List className="h-4 w-4" /></button>
              <button type="button" onClick={() => runListCommand('insertOrderedList')} className={toolbarButtonClass}><ListOrdered className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('justifyLeft')} className={toolbarButtonClass} title="Align left"><AlignLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('justifyCenter')} className={toolbarButtonClass} title="Align center"><AlignCenter className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('justifyRight')} className={toolbarButtonClass} title="Align right"><AlignRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => runCommand('formatBlock', 'blockquote')} className={toolbarButtonClass}><Quote className="h-4 w-4" /></button>
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Enter link URL')
                  if (url) runCommand('createLink', url)
                }}
                className={toolbarButtonClass}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => { saveSelection(); imageInputRef.current?.click() }} className={toolbarButtonClass}><ImageIcon className="h-4 w-4" /></button>
              <button
                type="button"
                onClick={removeSelectedImage}
                disabled={!hasSelectedImage}
                className={`${toolbarButtonClass} ${hasSelectedImage ? '' : 'cursor-not-allowed opacity-40'}`}
                title="Remove selected image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => runCommand('removeFormat')} className={toolbarButtonClass}><MoreHorizontal className="h-4 w-4" /></button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImage} />
            </div>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => {
                const text = event.currentTarget.textContent?.trim() ?? ''
                setCharacterCount(text.length)
                setWordCount(text ? text.split(/\s+/).length : 0)
                saveSelection()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.shiftKey) {
                  const selection = window.getSelection()
                  const node = selection?.anchorNode
                  const element = node instanceof Element ? node : node?.parentElement
                  const inListItem = Boolean(element?.closest('ol li, ul li'))
                  if (inListItem) {
                    event.preventDefault()
                    document.execCommand('insertParagraph')
                    saveSelection()
                  }
                }
              }}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              onClick={(event) => {
                const target = event.target as HTMLElement
                if (target.tagName === 'IMG') {
                  clearImageSelection()
                  target.setAttribute('data-selected', 'true')
                  ;(target as HTMLImageElement).style.outline = '2px solid #6366f1'
                  ;(target as HTMLImageElement).style.outlineOffset = '2px'
                  setHasSelectedImage(true)
                } else {
                  clearImageSelection()
                }
              }}
              className="min-h-[300px] space-y-4 bg-white px-4 py-5 text-[15px] leading-relaxed text-slate-700 focus:outline-none [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_img]:my-3 [&_img]:!h-auto [&_img]:!max-w-[220px] [&_img]:!w-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200"
            />

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
              <span>div &gt; p &gt; strong</span>
              <span>Characters: {characterCount} | Words: {wordCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Smile className="h-4 w-4" />
              <span>Use variables to personalize your announcement.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => runCommand('insertText', '{{ customer_name }}')}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {'{{ customer_name }}'}
              </button>
              <button
                type="button"
                onClick={() => runCommand('insertText', '{{ store_name }}')}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {'{{ store_name }}'}
              </button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                More variables <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="text-sm font-semibold text-slate-800">Container 2</div>
      </aside>
    </div>
  )
}

