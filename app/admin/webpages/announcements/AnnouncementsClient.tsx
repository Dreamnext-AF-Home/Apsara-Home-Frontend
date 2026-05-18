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
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

type VariableToken = {
  label: string
  token: string
}

type RecipientMode = 'all' | 'specific'

const VARIABLE_TOKENS: VariableToken[] = [
  { label: 'Customer Name', token: '{{ customer_name }}' },
  { label: 'First Name', token: '{{ first_name }}' },
  { label: 'Last Name', token: '{{ last_name }}' },
  { label: 'Username', token: '{{ username }}' },
  { label: 'Customer Email', token: '{{ customer_email }}' },
  { label: 'Email', token: '{{ email }}' },
  { label: 'Store Name', token: '{{ store_name }}' },
  { label: 'Current Date', token: '{{ current_date }}' },
  { label: 'Current Time', token: '{{ current_time }}' },
  { label: 'Current Year', token: '{{ current_year }}' },
  { label: 'Member Since', token: '{{ member_since }}' },
  { label: 'Support Email', token: '{{ support_email }}' },
]

export default function AnnouncementsClient() {
  const { data: session } = useSession()
  const [channels, setChannels] = useState({ email: true, sms: false })
  const [title, setTitle] = useState('')
  const initialContentHtml =
    '<p>Hi {{ customer_name }},</p><h2>Mega Sale Starts Tonight!</h2><p>Get ready for our biggest sale of the month!</p><p>Sale starts tonight at 12:00 AM.<br/>Shop now before stocks run out!</p>'
  const maxTitleLength = 100
  const editorRef = useRef<HTMLDivElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const selectionRangeRef = useRef<Range | null>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [hasSelectedImage, setHasSelectedImage] = useState(false)
  const [fontSize, setFontSize] = useState('14')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [showVariableMenu, setShowVariableMenu] = useState(false)
  const [showEmojiMenu, setShowEmojiMenu] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lastSendResult, setLastSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [isUploadingEditorImage, setIsUploadingEditorImage] = useState(false)
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all')
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false)
  const [isFocusedSearch, setIsFocusedSearch] = useState(false)

  const EMOJIS = [
    '😀','😁','😂','🤣','😊','😍','😘','😎','🤩','🥳','😇','🙂',
    '😉','🤗','🤔','😌','😴','😜','🤤','🙌','👏','👍','👋','🤝',
    '💙','❤️','🧡','💛','💚','💜','🖤','🤍','✨','🔥','🎉','🎊',
    '🛍️','🛒','💸','💰','📦','🚚','🏷️','📣','📢','📬','📧','✉️',
    '⭐','🌟','💫','✅','✔️','⚡','🚀','🎁','🧾','📱','💻','🕒'
  ]

  const toolbarButtonClass =
    'grid h-8 w-8 place-items-center rounded-md border border-transparent text-[#2f58c8] transition hover:border-[#c7d4ff] hover:bg-[#eef3ff] hover:text-[#1f45b5]'

  const baseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim()
  const accessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '').trim()

  const filteredMemberEmails = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase()
    if (!q) return memberEmails
    return memberEmails.filter((email) => email.toLowerCase().includes(q))
  }, [memberEmails, recipientSearch])

  const isAllVisibleSelected = useMemo(() => {
    if (filteredMemberEmails.length === 0) return false
    return filteredMemberEmails.every((email) => selectedEmails.includes(email))
  }, [filteredMemberEmails, selectedEmails])

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

  const insertEmoji = (emoji: string) => {
    runCommand('insertText', emoji)
    setShowEmojiMenu(false)
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

    const doUploadAndInsert = async () => {
      setIsUploadingEditorImage(true)
      try {
        const payload = new FormData()
        payload.append('file', file)
        payload.append('folder', 'web-content')

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: payload,
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data?.url) {
          toast.error(String(data?.error ?? 'Failed to upload image.'))
          return
        }

        const src = String(data.url)
        restoreSelection()
        const html = `<img src="${src}" alt="Announcement image" style="max-width:100%;width:auto;height:auto;display:block;border-radius:8px;border:1px solid #e2e8f0;margin:12px 0;" />`
        runCommand('insertHTML', html)
        toast.success('Image inserted.')
      } catch {
        toast.error('Failed to upload image.')
      } finally {
        setIsUploadingEditorImage(false)
      }
    }

    void doUploadAndInsert()
    event.target.value = ''
  }

  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerHTML = initialContentHtml
    const text = editorRef.current.textContent?.trim() ?? ''
    setCharacterCount(text.length)
    setWordCount(text ? text.split(/\s+/).length : 0)
  }, [])

  useEffect(() => {
    const loadRecipients = async () => {
      if (!baseUrl || !accessToken) return
      setIsLoadingRecipients(true)
      try {
        const params = new URLSearchParams({
          recipient_type: 'members',
          per_page: '100000',
        })
        const response = await fetch(`${baseUrl}/api/admin/email-blast/recipients?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          toast.error(String(data?.message ?? 'Failed to load recipient emails.'))
          return
        }
        const emails = Array.isArray(data?.recipients)
          ? data.recipients
              .map((item: unknown) => String(item ?? '').trim().toLowerCase())
              .filter((email: string) => email.length > 0)
          : []
        setMemberEmails(Array.from(new Set(emails)))
      } catch {
        toast.error('Unable to load member emails.')
      } finally {
        setIsLoadingRecipients(false)
      }
    }

    loadRecipients()
  }, [baseUrl, accessToken])

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

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => (prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]))
  }

  const toggleSelectVisible = () => {
    if (filteredMemberEmails.length === 0) return
    setSelectedEmails((prev) => {
      if (isAllVisibleSelected) {
        return prev.filter((email) => !filteredMemberEmails.includes(email))
      }
      const next = new Set(prev)
      filteredMemberEmails.forEach((email) => next.add(email))
      return Array.from(next)
    })
  }

  const sendAnnouncement = async () => {
    const liveEditorHtml = editorRef.current?.innerHTML?.trim() ?? ''
    if (!channels.email) {
      toast.error('Please enable Email channel.')
      return
    }
    if (!title.trim()) {
      toast.error('Announcement title is required.')
      return
    }
    if (!liveEditorHtml) {
      toast.error('Announcement content is required.')
      return
    }
    if (!baseUrl) {
      toast.error('Missing NEXT_PUBLIC_LARAVEL_API_URL.')
      return
    }
    if (!accessToken) {
      toast.error('Session expired. Please log in again.')
      return
    }
    if (recipientMode === 'specific' && selectedEmails.length === 0) {
      toast.error('Select at least one recipient email.')
      return
    }

    setIsSending(true)
    setLastSendResult(null)

    try {
      const safeTitle = title
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
      const firstImageMatch = liveEditorHtml.match(/<img\b[^>]*>/i)
      const topImageHtml = firstImageMatch ? firstImageMatch[0] : ''
      const contentWithoutTopImage = firstImageMatch
        ? liveEditorHtml.replace(firstImageMatch[0], '').trim()
        : liveEditorHtml
      const normalizedTopImage = topImageHtml
        ? topImageHtml.replace(
            /style=["'][^"']*["']/i,
            'style="display:block;width:100%;max-width:100%;height:auto;border:0;border-radius:0;margin:0 0 16px;"'
          )
        : ''
      const bodyWithTitle = `${normalizedTopImage}<h1 style="margin:0 0 14px;font-size:30px;line-height:1.2;font-weight:800;color:#0f172a;">${safeTitle}</h1>${contentWithoutTopImage}`
      const formData = new FormData()
      formData.append('subject', title.trim())
      formData.append('body', bodyWithTitle)
      if (recipientMode === 'all') {
        formData.append('recipient_type', 'members')
      } else {
        selectedEmails.forEach((email) => formData.append('recipients[]', email))
      }

      const response = await fetch(`${baseUrl}/api/admin/email-blast/send`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(String(data?.message ?? 'Failed to send announcement.'))
        return
      }

      const sent = Number(data?.sent_count ?? 0)
      const failed = Number(data?.failed_count ?? 0)
      setLastSendResult({ sent, failed })
      setSelectedEmails([])
      setRecipientSearch('')
      toast.success(`Announcement sent. Success: ${sent}, Failed: ${failed}`)
    } catch {
      toast.error('Unexpected error while sending announcement.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="space-y-5 rounded-2xl border border-[#dce5ff] bg-white p-4 shadow-sm xl:col-span-8 md:p-5">
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-[#17398d]">1. Channel</h2>
          <p className="text-sm text-[#4e67ab]">Choose where you want to send this announcement.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label
              htmlFor="announcement-channel-email"
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                channels.email ? 'border-[#3f69db] bg-[#f3f6ff]' : 'border-[#d6dff7] bg-white'
              }`}
            >
              <input
                id="announcement-channel-email"
                type="checkbox"
                checked={channels.email}
                onChange={(event) => setChannels((prev) => ({ ...prev, email: event.target.checked }))}
                className="sr-only"
              />
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2457e7] text-white shadow-sm">
                <Mail className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-[#1a357f]">Email</span>
                <span className="block text-sm text-[#4e67ab]">Send via email</span>
              </span>
              <span className={`h-5 w-5 rounded-full border-2 ${channels.email ? 'border-[#2457e7]' : 'border-[#a7b8e6]'}`}>
                <span className={`m-[3px] block h-2.5 w-2.5 rounded-full ${channels.email ? 'bg-[#2457e7]' : 'bg-transparent'}`} />
              </span>
            </label>

            <label
              htmlFor="announcement-channel-sms"
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                channels.sms ? 'border-[#3f69db] bg-[#f3f6ff]' : 'border-[#d6dff7] bg-white'
              }`}
            >
              <input
                id="announcement-channel-sms"
                type="checkbox"
                checked={channels.sms}
                onChange={(event) => setChannels((prev) => ({ ...prev, sms: event.target.checked }))}
                className="sr-only"
              />
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef3ff] text-[#2457e7] shadow-sm">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-[#1a357f]">SMS</span>
                <span className="block text-sm text-[#4e67ab]">Send via SMS</span>
              </span>
              <span className={`h-5 w-5 rounded-full border-2 ${channels.sms ? 'border-[#2457e7]' : 'border-[#a7b8e6]'}`}>
                <span className={`m-[3px] block h-2.5 w-2.5 rounded-full ${channels.sms ? 'bg-[#2457e7]' : 'bg-transparent'}`} />
              </span>
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-[#17398d]">2. Announcement Title</h2>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, maxTitleLength))}
              placeholder="Enter announcement title"
              className="w-full rounded-xl border border-[#d6dff7] px-4 py-3 pr-16 text-sm text-[#1a357f] placeholder:text-[#8fa0cf] focus:border-[#4f75dc] focus:outline-none focus:ring-2 focus:ring-[#dbe6ff]"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4f75dc]">
              {title.length}/{maxTitleLength}
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[20px] font-bold text-[#17398d]">3. Content</h2>
          <p className="text-sm text-[#4e67ab]">Create your announcement content. You can format text, add images, buttons and more.</p>

          <div className="overflow-hidden rounded-xl border border-[#d6dff7]">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#d6dff7] bg-[#eef3ff] px-3 py-2">
              <button type="button" className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-[#1a357f] hover:bg-[#dde8ff]">
                Paragraph <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <label className="ml-1 flex h-8 items-center rounded-md border border-[#cfdbfd] bg-white px-2 text-xs text-[#2f58c8]">
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
              <label className="ml-1 flex h-8 items-center rounded-md border border-[#cfdbfd] bg-white px-2 text-xs text-[#2f58c8]">
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
              <div className="relative">
                <button type="button" onClick={() => setShowEmojiMenu((prev) => !prev)} className={toolbarButtonClass} title="Insert emoji">
                  <Smile className="h-4 w-4" />
                </button>
                {showEmojiMenu ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-lg border border-[#c7d4ff] bg-white p-2 shadow-lg">
                    <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="rounded-md p-1.5 text-lg hover:bg-[#eef3ff]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => runCommand('removeFormat')} className={toolbarButtonClass}><MoreHorizontal className="h-4 w-4" /></button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImage} />
            </div>
            {isUploadingEditorImage ? (
              <div className="border-b border-[#d6dff7] bg-amber-50 px-4 py-2 text-xs text-amber-700">
                Uploading image...
              </div>
            ) : null}

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
              className="min-h-[300px] max-h-[520px] overflow-y-auto space-y-4 bg-white px-4 py-5 text-[15px] leading-relaxed text-[#2f4177] focus:outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_img]:my-3 [&_img]:!h-auto [&_img]:!max-w-[320px] [&_img]:!w-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-[#c7d4ff]"
            />

            <div className="flex items-center justify-between border-t border-[#d6dff7] bg-[#eef3ff] px-4 py-2 text-xs text-[#4f75dc]">
              <span>div &gt; p &gt; strong</span>
              <span>Characters: {characterCount} | Words: {wordCount}</span>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6dff7] bg-[#eef3ff] px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[#2f58c8]">
              <Smile className="h-4 w-4 text-[#2f58c8]" />
              <span>Use variables to personalize your announcement.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {VARIABLE_TOKENS.slice(0, 2).map((token) => (
                <button
                  key={token.token}
                  type="button"
                  onClick={() => runCommand('insertText', token.token)}
                  className="rounded-md border border-[#c7d4ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f58c8]"
                >
                  {token.token}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowVariableMenu((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-md border border-[#c7d4ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f58c8]"
              >
                More variables <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {showVariableMenu ? (
              <div className="absolute right-3 bottom-[calc(100%+6px)] z-20 w-72 rounded-lg border border-[#c7d4ff] bg-white p-2 shadow-lg">
                {VARIABLE_TOKENS.map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => {
                      runCommand('insertText', item.token)
                      setShowVariableMenu(false)
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs text-[#2f4177] hover:bg-[#eef3ff]"
                  >
                    <span>{item.label}</span>
                    <span className="text-[#7f95d4]">{item.token}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="space-y-4 rounded-2xl border border-[#dce5ff] bg-white p-4 shadow-sm xl:col-span-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2457e7] text-white shadow-sm">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#17398d]">Announcement Actions</div>
            <p className="mt-0.5 text-sm text-[#4e67ab]">Choose audience and send your announcement.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#d6dff7] p-3">
          <p className="text-sm font-bold text-[#17398d]">Recipients</p>
          <label className="flex items-center gap-2 text-sm text-[#2f4177]">
            <input
              type="radio"
              checked={recipientMode === 'all'}
              onChange={() => setRecipientMode('all')}
            />
            Send to all registered members
          </label>
          <label className="flex items-center gap-2 text-sm text-[#2f4177]">
            <input
              type="radio"
              checked={recipientMode === 'specific'}
              onChange={() => setRecipientMode('specific')}
            />
            Send to specific emails
          </label>

          {recipientMode === 'specific' ? (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${isFocusedSearch ? 'border-[#4f75dc] ring-2 ring-[#dbe6ff]' : 'border-[#d6dff7]'}`}>
                <input
                  type="text"
                  value={recipientSearch}
                  onFocus={() => setIsFocusedSearch(true)}
                  onBlur={() => setIsFocusedSearch(false)}
                  onChange={(event) => setRecipientSearch(event.target.value)}
                  placeholder="Search member email"
                  className="w-full text-xs text-[#1a357f] placeholder:text-[#8fa0cf] focus:outline-none"
                />
                <svg className="h-3.5 w-3.5 text-[#7f95d4]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              </div>
              <button
                type="button"
                onClick={toggleSelectVisible}
                className="rounded-md border border-[#c7d4ff] px-2 py-1 text-[11px] font-semibold text-[#2f58c8] hover:bg-[#eef3ff]"
              >
                {isAllVisibleSelected ? 'Unselect visible' : 'Select visible'}
              </button>
              <div className="max-h-64 overflow-auto rounded-lg border border-[#d6dff7] p-1.5">
                {isLoadingRecipients ? (
                  <p className="px-2 py-1 text-[11px] text-[#7f95d4]">Loading emails...</p>
                ) : filteredMemberEmails.length === 0 ? (
                  <p className="px-2 py-1 text-[11px] text-[#7f95d4]">No emails found.</p>
                ) : (
                  filteredMemberEmails.map((email) => (
                    <label key={email} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[13px] text-[#2f4177] hover:bg-[#eef3ff]">
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(email)}
                        onChange={() => toggleEmail(email)}
                      />
                      <span className="truncate">{email}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-[12px] font-semibold text-[#4f75dc]">Selected: {selectedEmails.length}</p>
              {selectedEmails.length > 0 ? (
                <div className="max-h-24 overflow-auto rounded-lg border border-[#d6dff7] bg-[#f7f9ff] p-2">
                  <p className="mb-1 text-[11px] font-semibold text-[#4f75dc]">Selected emails</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmails.map((email) => (
                      <span key={email} className="inline-flex items-center gap-1 rounded-full border border-[#c7d4ff] bg-white px-2 py-0.5 text-[10px] text-[#2f4177]">
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedEmails((prev) => prev.filter((item) => item !== email))}
                          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#c7d4ff] text-[9px] leading-none text-[#2f58c8] hover:bg-[#eef3ff]"
                          title={`Remove ${email}`}
                          aria-label={`Remove ${email}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={sendAnnouncement}
          disabled={isSending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2457e7] px-4 py-2.5 text-base font-semibold text-white transition hover:bg-[#1f4bd0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
          {isSending
            ? recipientMode === 'all'
              ? 'Sending to all members...'
              : 'Sending to selected emails...'
            : 'Send Announcement'}
        </button>

        {lastSendResult ? (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#d6dff7] bg-[#f7f9ff] p-3">
            <div className="rounded-lg border border-[#dce5ff] bg-white p-3 text-center">
              <p className="text-xs font-semibold text-[#4f75dc]">Sent</p>
              <p className="text-2xl font-bold text-[#17398d]">{lastSendResult.sent}</p>
            </div>
            <div className="rounded-lg border border-[#dce5ff] bg-white p-3 text-center">
              <p className="text-xs font-semibold text-[#4f75dc]">Failed</p>
              <p className="text-2xl font-bold text-[#17398d]">{lastSendResult.failed}</p>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
