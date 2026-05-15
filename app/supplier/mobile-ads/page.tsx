'use client'

import { useState } from 'react'
import { Plus, GripVertical, Trash2, Edit2, Image as ImageIcon, LayoutGrid, Type } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface Section {
  id: string
  type: 'carousel' | 'banner' | 'product-grid' | 'categories' | 'text'
  title: string
  order: number
}

const SECTION_TYPES = [
  { value: 'carousel', label: 'Carousel', icon: LayoutGrid, color: 'blue' },
  { value: 'banner', label: 'Banner Image', icon: ImageIcon, color: 'purple' },
  { value: 'product-grid', label: 'Product Grid', icon: LayoutGrid, color: 'green' },
  { value: 'categories', label: 'Categories', icon: LayoutGrid, color: 'orange' },
  { value: 'text', label: 'Text Section', icon: Type, color: 'red' },
]

export default function MobileManagementHomePage() {
  const [sections, setSections] = useState<Section[]>([
    { id: '1', type: 'carousel', title: 'Featured Carousel', order: 0 },
    { id: '2', type: 'banner', title: 'Promotional Banner', order: 1 },
    { id: '3', type: 'product-grid', title: 'New Arrivals', order: 2 },
  ])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const draggedIndex = sections.findIndex((s) => s.id === draggedId)
    const targetIndex = sections.findIndex((s) => s.id === targetId)

    const newSections = [...sections]
    const [draggedSection] = newSections.splice(draggedIndex, 1)
    newSections.splice(targetIndex, 0, draggedSection)

    setSections(newSections.map((s, i) => ({ ...s, order: i })))
    setDraggedId(null)
  }

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: `New ${SECTION_TYPES.find((st) => st.value === type)?.label}`,
      order: sections.length,
    }
    setSections([...sections, newSection])
    setShowAddModal(false)
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  const getSectionIcon = (type: Section['type']) => {
    return SECTION_TYPES.find((st) => st.value === type)?.icon || LayoutGrid
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mobile Home Builder</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Drag to reorder sections on your mobile home screen</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
        >
          <Plus className="h-5 w-5" />
          Add Section
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sections List */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Home Sections</h2>

            {sections.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
                <p className="text-slate-500 dark:text-slate-400">No sections yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {sections.map((section) => {
                    const Icon = getSectionIcon(section.type)
                    return (
                      <motion.div
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, section.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e as any, section.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`group flex items-center gap-4 rounded-2xl border-2 p-4 transition ${
                          draggedId === section.id
                            ? 'border-cyan-500 bg-cyan-50/50 dark:border-cyan-400/50 dark:bg-cyan-500/10'
                            : 'border-slate-200/80 bg-white/50 hover:border-cyan-200 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-cyan-400/30'
                        } cursor-grab active:cursor-grabbing`}
                      >
                        <GripVertical className="h-5 w-5 text-slate-400 transition opacity-0 group-hover:opacity-100" />

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.05]">
                          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{section.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {SECTION_TYPES.find((st) => st.value === section.type)?.label}
                          </p>
                        </div>

                        <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-blue-400/30 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSection(section.id)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-red-400/30 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Preview</h2>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
                {/* Mobile phone frame */}
                <div className="mx-auto w-64 rounded-3xl border-8 border-slate-900 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                  <div className="space-y-2 p-3">
                    <div className="space-y-2">
                      {sections.slice(0, 3).map((section) => {
                        const Icon = getSectionIcon(section.type)
                        return (
                          <div key={section.id} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{section.title}</p>
                            </div>
                          </div>
                        )
                      })}
                      {sections.length > 3 && (
                        <div className="text-center text-xs text-slate-500 dark:text-slate-400">+{sections.length - 3} more</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">✓ {sections.length} sections active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
            >
              <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Add New Section</h3>

              <div className="grid gap-3">
                {SECTION_TYPES.map((sectionType) => {
                  const Icon = sectionType.icon
                  return (
                    <button
                      key={sectionType.value}
                      onClick={() => addSection(sectionType.value as Section['type'])}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-white/10 dark:hover:border-cyan-400/30 dark:hover:bg-cyan-500/10"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.05]">
                        <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{sectionType.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="mt-4 w-full rounded-2xl border border-slate-200/80 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
