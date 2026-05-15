'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@heroui/react/button'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface FormData {
  subject: string
  body: string
  bannerImage: File | null
  recipients: string
  attachments: File[]
}

interface Member {
  id: string
  email: string
  name?: string
}

export default function EmailBlastForm() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    body: '',
    bannerImage: null,
    recipients: '',
    attachments: [],
  })
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sendResult, setSendResult] = useState<{ sent_count: number; failed_count: number; failed_emails?: string[] } | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const baseUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL

  // Check if user has permission to send emails
  const userRole = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase()
  const canSendEmails = userRole === 'super_admin' || userRole === 'admin'

  // Fetch members on mount
  useEffect(() => {
    if (session?.user?.accessToken && baseUrl) {
      fetchMembers()
    }
  }, [session?.user?.accessToken, baseUrl])

  // Initialize and restore editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = formData.body
    }
  }, [showPreview])

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true)
      const url = `${baseUrl}/api/admin/email-blast/recipients`
      const token = session?.user?.accessToken

      const params = new URLSearchParams({
        recipient_type: 'members',
        per_page: '10000',
      })

      const res = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        const emailList = data.recipients || []
        const membersList = emailList.map((email: string, index: number) => ({
          id: `member_${index}`,
          email: email,
          name: email.split('@')[0],
        }))

        setMembers(membersList)
        toast.success(`Loaded ${membersList.length} members`)
      } else {
        toast.error(`Error: ${data.message || 'Failed to load members'}`)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      attachments: files,
    }))
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleMemberSelect = (memberId: string, email: string) => {
    let newSelected = [...selectedMemberIds]
    let newRecipients = formData.recipients.split(',').map(e => e.trim()).filter(Boolean)

    if (newSelected.includes(memberId)) {
      newSelected = newSelected.filter(id => id !== memberId)
      newRecipients = newRecipients.filter(e => e !== email)
    } else {
      newSelected.push(memberId)
      if (!newRecipients.includes(email)) {
        newRecipients.push(email)
      }
    }

    setSelectedMemberIds(newSelected)
    setFormData(prev => ({
      ...prev,
      recipients: newRecipients.join(', '),
    }))
  }

  const handleSelectAll = () => {
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([])
      setFormData(prev => ({
        ...prev,
        recipients: '',
      }))
    } else {
      setSelectedMemberIds(members.map(m => m.id))
      const allEmails = members.map(m => m.email).join(', ')
      setFormData(prev => ({
        ...prev,
        recipients: allEmails,
      }))
    }
  }

  const applyFormatting = (command: string, value: string = '') => {
    if (!editorRef.current) return

    const editor = editorRef.current
    editor.focus()
    document.execCommand(command, false, value)
    setFormData(prev => ({ ...prev, body: editor.innerHTML }))
  }

  const generatePreview = () => {
    if (!formData.subject || !formData.body) {
      toast.error('Subject and body are required')
      return
    }

    let imageHtml = ''
    if (formData.bannerImage) {
      const imageUrl = URL.createObjectURL(formData.bannerImage)
      imageHtml = `<div style="text-align:center;margin:0 0 20px;"><img src="${imageUrl}" alt="Banner" style="max-width:100%;height:auto;max-height:200px;"></div>`
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${imageHtml}${formData.body}</body></html>`

    setPreviewHtml(html)
    setShowPreview(true)
    toast.success('Preview ready')
  }

  const handleSend = async () => {
    if (!session?.user?.accessToken) {
      toast.error('Not authenticated')
      return
    }

    if (!canSendEmails) {
      toast.error('You do not have permission to send email blasts')
      return
    }

    if (!formData.subject || !formData.body) {
      toast.error('Subject and body required')
      return
    }

    if (!formData.recipients.trim()) {
      toast.error('Please select at least one recipient')
      return
    }

    const recipientList = formData.recipients.split(',').map(e => e.trim()).filter(Boolean)

    if (!window.confirm(`Send email to ${recipientList.length} member(s)?`)) return

    setLoading(true)
    setIsOpen(true)

    try {
      const recipientEmails = formData.recipients.split(',').map(e => e.trim()).filter(Boolean)
      const formDataToSend = new FormData()

      formDataToSend.append('subject', formData.subject)
      formDataToSend.append('body', formData.body)
      if (formData.bannerImage) formDataToSend.append('banner_image', formData.bannerImage)

      recipientEmails.forEach(email => {
        formDataToSend.append('recipients[]', email)
      })

      formData.attachments.forEach(file => {
        formDataToSend.append('attachments[]', file)
      })

      const res = await fetch(`${baseUrl}/api/admin/email-blast/send`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: formDataToSend,
      })

      const result = await res.json()

      if (res.ok) {
        setSendResult({
          sent_count: result.sent_count,
          failed_count: result.failed_count,
          failed_emails: result.failed_emails,
        })
        setFormData({ subject: '', body: '', bannerImage: null, recipients: '', attachments: [] })
        setSelectedMemberIds([])
      } else {
        setSendResult({
          sent_count: 0,
          failed_count: recipientEmails.length,
          failed_emails: recipientEmails,
        })
        toast.error(result.message || 'Failed to send')
      }
    } catch (error) {
      setSendResult({
        sent_count: 0,
        failed_count: formData.recipients.split(',').filter(e => e.trim()).length,
      })
      toast.error('Error sending email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {!showPreview ? (
        <div className="space-y-4">
          {/* Recipients Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Recipients *</label>
            <textarea
              placeholder="Recipient emails will appear here"
              value={formData.recipients}
              readOnly
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.recipients.split(',').filter(e => e.trim()).length} recipient(s) selected</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.subject.length}/255</p>
          </div>

          {/* Message with Rich Text Toolbar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>

            {/* Toolbar */}
            <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
              <button type="button" onClick={() => applyFormatting('bold')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold" title="Bold">B</button>
              <button type="button" onClick={() => applyFormatting('italic')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm italic">I</button>
              <button type="button" onClick={() => applyFormatting('underline')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm underline">U</button>

              <div className="border-l border-gray-300 mx-1"></div>

              <button type="button" onClick={() => applyFormatting('justifyLeft')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs" title="Align Left">⬅</button>
              <button type="button" onClick={() => applyFormatting('justifyCenter')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs" title="Align Center">↔</button>
              <button type="button" onClick={() => applyFormatting('justifyRight')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs" title="Align Right">➡</button>

              <div className="border-l border-gray-300 mx-1"></div>

              <button type="button" onClick={() => applyFormatting('insertUnorderedList')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs" title="Bullet List">• List</button>
              <button type="button" onClick={() => applyFormatting('insertOrderedList')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs" title="Numbered List">1. List</button>

              <div className="border-l border-gray-300 mx-1"></div>

              <input type="color" onChange={(e) => applyFormatting('foreColor', e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" title="Text Color" />

              <button type="button" onClick={() => applyFormatting('removeFormat')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs" title="Clear Formatting">Clear</button>
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                if (editorRef.current) {
                  setFormData(prev => ({ ...prev, body: editorRef.current!.innerHTML }))
                }
              }}
              className="w-full px-3 py-2 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-64 bg-white text-gray-900"
              style={{ minHeight: '300px', wordWrap: 'break-word' }}
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">HTML formatting supported</p>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setFormData(prev => ({ ...prev, bannerImage: file }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.bannerImage && (
              <div className="mt-2">
                <img src={URL.createObjectURL(formData.bannerImage)} alt="banner preview" className="max-h-40 rounded border border-gray-300" />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bannerImage: null }))}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold mt-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Attachments (optional)</label>
            <input
              type="file"
              multiple
              onChange={handleAttachmentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Select Members */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Members * ({members.length} total)</label>
            {loadingMembers ? (
              <div className="border border-gray-300 rounded-lg p-4 text-center text-gray-500">Loading members...</div>
            ) : (
              <>
                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Search email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Select All Button */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full text-left px-2 py-2 hover:bg-blue-50 rounded font-semibold text-sm text-blue-600 mb-2 border border-gray-300 bg-white"
                >
                  {selectedMemberIds.length === members.length && members.length > 0 ? '✓ Deselect All' : '☐ Select All'}
                </button>

                {/* Scrollable Member List */}
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {(() => {
                    const filtered = members.filter(m => m.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    return filtered.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">{searchTerm ? 'No results found' : 'No members available'}</p>
                    ) : (
                      filtered.map(member => (
                        <label key={member.id} className="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(member.id)}
                            onChange={() => handleMemberSelect(member.id, member.email)}
                            className="w-4 h-4"
                          />
                          <span className="ml-2 text-sm text-gray-700">{member.email}</span>
                        </label>
                      ))
                    )
                  })()}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="bordered" onPress={generatePreview}>
              Preview
            </Button>
            <Button
              color="primary"
              onPress={handleSend}
              isLoading={loading}
              disabled={!canSendEmails || !formData.subject || !formData.body || !formData.recipients.trim()}
            >
              Send Email
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowPreview(false)}
            className="text-sm text-blue-600 font-semibold mb-4 hover:underline"
          >
            ← Back to Edit
          </button>
          <iframe srcDoc={previewHtml} style={{ width: '100%', height: '600px', border: '1px solid #e5e7eb', borderRadius: '8px' }} title="Preview" />
          <p className="text-xs text-gray-500 mt-2">Subject: {formData.subject}</p>
          <p className="text-xs text-gray-500 mt-1">Recipients: {formData.recipients.split(',').filter(e => e.trim()).length}</p>
        </div>
      )}

      {/* Send Status Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            {loading ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Sending Email Blast...</h2>
                </div>
                <div className="px-6 py-8">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-center">Processing your email blast. Please wait...</p>
                  </div>
                </div>
              </>
            ) : sendResult ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Email Blast Result</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✓</span>
                      <div>
                        <p className="font-semibold text-green-600">{sendResult.sent_count} email(s) sent successfully</p>
                      </div>
                    </div>

                    {sendResult.failed_count > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">✗</span>
                        <div>
                          <p className="font-semibold text-red-600">{sendResult.failed_count} email(s) failed</p>
                          {sendResult.failed_emails && sendResult.failed_emails.length > 0 && (
                            <div className="mt-2 bg-red-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                              {sendResult.failed_emails.map((email, idx) => (
                                <p key={idx} className="text-red-700">{email}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {sendResult.failed_count === 0 && (
                      <p className="text-green-600 text-center font-semibold">All emails sent successfully!</p>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <Button color="primary" onPress={() => setIsOpen(false)}>
                    Done
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
