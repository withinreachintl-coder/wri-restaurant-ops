'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getAuditForms,
  getAuditFormWithItems,
  createAuditForm,
  updateAuditForm,
  deleteAuditForm,
  addAuditItem,
  updateAuditItem,
  deleteAuditItem,
  createAuditRun,
  type AuditForm,
  type AuditItem,
  type AuditFormWithItems,
  type AuditCategory,
  type AuditFieldType,
} from '@/lib/audits'

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  cash_handling: 'Cash Handling',
  void_comp: 'Void/Comp Review',
  waste: 'Waste Tracking',
  inventory: 'Inventory Spot-Check',
  general: 'General',
}

const FIELD_TYPE_LABELS: Record<AuditFieldType, string> = {
  text: 'Text Answer',
  numeric: 'Number',
  select: 'Multiple Choice',
  checkbox: 'Pass/Fail',
}

const LABEL_STYLE = {
  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
  fontSize: '11px',
  fontWeight: 500,
  color: '#6B5B4E',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: '6px',
}

const INPUT_STYLE = {
  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
  fontSize: '14px',
  color: '#1C1917',
  background: '#FFFFFF',
  border: '1px solid #E8E3DC',
  borderRadius: '6px',
  padding: '10px 12px',
  width: '100%',
  outline: 'none',
}

const SELECT_STYLE = { ...INPUT_STYLE, cursor: 'pointer' }

type EditingItem = Partial<AuditItem> & { _new?: boolean }

export default function AuditFormsPage() {
  const [forms, setForms] = useState<AuditForm[]>([])
  const [selectedForm, setSelectedForm] = useState<AuditFormWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [newFormData, setNewFormData] = useState({ name: '', description: '', category: 'general' as AuditCategory })
  const [startingRun, setStartingRun] = useState(false)

  const loadForms = useCallback(async () => {
    try {
      const data = await getAuditForms()
      setForms(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadForms() }, [loadForms])

  const selectForm = async (formId: string) => {
    try {
      const data = await getAuditFormWithItems(formId)
      setSelectedForm(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleCreateForm = async () => {
    if (!newFormData.name.trim()) return
    setSaving(true)
    try {
      await createAuditForm(newFormData)
      setNewFormData({ name: '', description: '', category: 'general' })
      setShowNewForm(false)
      await loadForms()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Deactivate this audit form? Existing run history is preserved.')) return
    try {
      await deleteAuditForm(formId)
      if (selectedForm?.id === formId) setSelectedForm(null)
      await loadForms()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleSaveItem = async () => {
    if (!editingItem || !selectedForm || !editingItem.label?.trim()) return
    setSaving(true)
    try {
      if (editingItem._new) {
        await addAuditItem(selectedForm.id, {
          label: editingItem.label!,
          field_type: editingItem.field_type ?? 'checkbox',
          select_options: editingItem.select_options ?? null,
          threshold_min: editingItem.threshold_min ?? null,
          threshold_max: editingItem.threshold_max ?? null,
          photo_required: editingItem.photo_required ?? false,
          is_required: editingItem.is_required ?? true,
        })
      } else if (editingItem.id) {
        await updateAuditItem(editingItem.id, {
          label: editingItem.label,
          field_type: editingItem.field_type,
          select_options: editingItem.select_options ?? null,
          threshold_min: editingItem.threshold_min ?? null,
          threshold_max: editingItem.threshold_max ?? null,
          photo_required: editingItem.photo_required ?? false,
          is_required: editingItem.is_required ?? true,
        })
      }
      setEditingItem(null)
      const refreshed = await getAuditFormWithItems(selectedForm.id)
      setSelectedForm(refreshed)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedForm) return
    try {
      await deleteAuditItem(itemId)
      const refreshed = await getAuditFormWithItems(selectedForm.id)
      setSelectedForm(refreshed)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleStartRun = async () => {
    if (!selectedForm) return
    setStartingRun(true)
    try {
      const run = await createAuditRun(selectedForm.id, 'Main Location')
      window.location.href = `/audit-run/${run.id}`
    } catch (e: any) {
      setError(e.message)
      setStartingRun(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#F5F0E8',
                  marginBottom: '4px',
                }}
              >
                LP Audit Forms
              </h1>
              <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', fontWeight: 300, color: '#A89880' }}>
                Loss prevention — configure, schedule, and run audits
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link
                href="/audit-exceptions"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D97706',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  border: '1px solid rgba(217,119,6,0.4)',
                  borderRadius: '4px',
                }}
              >
                Exceptions
              </Link>
              <Link
                href="/audit-trends"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  textDecoration: 'none',
                }}
              >
                Trends
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Forms List */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Audit Forms
            </h2>
            <button
              onClick={() => setShowNewForm(true)}
              className="hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            >
              + New Form
            </button>
          </div>

          {/* New Form Panel */}
          {showNewForm && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '18px', fontWeight: 600, color: '#1C1917', marginBottom: '20px' }}>New Audit Form</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>Form Name</label>
                  <input
                    style={INPUT_STYLE}
                    placeholder="e.g. Daily Cash Handling Audit"
                    value={newFormData.name}
                    onChange={e => setNewFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Category</label>
                  <select
                    style={SELECT_STYLE}
                    value={newFormData.category}
                    onChange={e => setNewFormData(p => ({ ...p, category: e.target.value as AuditCategory }))}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Description (optional)</label>
                  <textarea
                    style={{ ...INPUT_STYLE, minHeight: '72px', resize: 'vertical' }}
                    placeholder="What does this audit cover?"
                    value={newFormData.description}
                    onChange={e => setNewFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowNewForm(false)}
                    style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateForm}
                    disabled={saving || !newFormData.name.trim()}
                    style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: saving ? '#B45309' : '#D97706', borderRadius: '4px', padding: '8px 20px', border: 'none', cursor: 'pointer' }}
                  >
                    {saving ? 'Creating...' : 'Create Form'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', padding: '32px', textAlign: 'center' }}>Loading...</div>
          ) : forms.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '16px' }}>No audit forms yet.</p>
              <button
                onClick={() => setShowNewForm(true)}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
              >
                Create your first audit form
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {forms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => selectForm(form.id)}
                  style={{
                    background: '#FFFFFF',
                    border: selectedForm?.id === form.id ? '1px solid #D97706' : '1px solid #E8E3DC',
                    borderLeft: selectedForm?.id === form.id ? '3px solid #D97706' : '3px solid transparent',
                    borderRadius: '8px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#1C1917', marginBottom: '4px' }}>{form.name}</div>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {CATEGORY_LABELS[form.category]}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteForm(form.id) }}
                    className="hover:opacity-60 transition-opacity"
                    style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Form Builder */}
        {selectedForm && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Form Builder — {selectedForm.name}
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href={`/audit-forms/${selectedForm.id}/schedule`}
                  style={{
                    fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E',
                    border: '1px solid #E8E3DC', borderRadius: '4px', padding: '8px 14px', textDecoration: 'none',
                  }}
                >
                  Schedule
                </Link>
                <button
                  onClick={handleStartRun}
                  disabled={startingRun || selectedForm.audit_items.length === 0}
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500,
                    color: '#1C1917', background: '#D97706', borderRadius: '4px',
                    padding: '8px 16px', border: 'none', cursor: 'pointer',
                  }}
                >
                  {startingRun ? 'Starting...' : '▶ Start Audit'}
                </button>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', overflow: 'hidden' }}>
              {selectedForm.audit_items.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E' }}>No items yet. Add your first audit question below.</p>
                </div>
              ) : (
                <div>
                  {selectedForm.audit_items.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: idx < selectedForm.audit_items.length - 1 ? '1px solid #F0EBE3' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#A89880', minWidth: '24px', paddingTop: '2px' }}>
                        {idx + 1}.
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 400, color: '#1C1917', marginBottom: '4px' }}>
                          {item.label}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#6B5B4E', background: '#F5F0E8', padding: '2px 8px', borderRadius: '4px' }}>
                            {FIELD_TYPE_LABELS[item.field_type]}
                          </span>
                          {item.photo_required && (
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#6B5B4E', background: '#F5F0E8', padding: '2px 8px', borderRadius: '4px' }}>
                              📷 Photo
                            </span>
                          )}
                          {item.threshold_min !== null && (
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#D97706', background: 'rgba(217,119,6,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              Min: {item.threshold_min}
                            </span>
                          )}
                          {item.threshold_max !== null && (
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#D97706', background: 'rgba(217,119,6,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              Max: {item.threshold_max}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item button */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #F0EBE3' }}>
                <button
                  onClick={() => setEditingItem({ _new: true, field_type: 'checkbox', photo_required: false, is_required: true })}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  + Add Question
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Item Editor Modal */}
        {editingItem && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
            onClick={(e) => e.target === e.currentTarget && setEditingItem(null)}
          >
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '20px', fontWeight: 600, color: '#1C1917', marginBottom: '24px' }}>
                {editingItem._new ? 'Add Question' : 'Edit Question'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>Question / Label</label>
                  <input
                    style={INPUT_STYLE}
                    placeholder="e.g. Walk-in temp within range?"
                    value={editingItem.label ?? ''}
                    onChange={e => setEditingItem(p => ({ ...p!, label: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={LABEL_STYLE}>Answer Type</label>
                  <select
                    style={SELECT_STYLE}
                    value={editingItem.field_type ?? 'checkbox'}
                    onChange={e => setEditingItem(p => ({ ...p!, field_type: e.target.value as AuditFieldType }))}
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {editingItem.field_type === 'select' && (
                  <div>
                    <label style={LABEL_STYLE}>Options (one per line)</label>
                    <textarea
                      style={{ ...INPUT_STYLE, minHeight: '80px', resize: 'vertical' }}
                      placeholder={'Pass\nFail\nN/A'}
                      value={(editingItem.select_options ?? []).join('\n')}
                      onChange={e => setEditingItem(p => ({
                        ...p!,
                        select_options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean),
                      }))}
                    />
                  </div>
                )}

                {editingItem.field_type === 'numeric' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={LABEL_STYLE}>Min threshold (optional)</label>
                      <input
                        type="number"
                        style={INPUT_STYLE}
                        placeholder="e.g. 34"
                        value={editingItem.threshold_min ?? ''}
                        onChange={e => setEditingItem(p => ({ ...p!, threshold_min: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Max threshold (optional)</label>
                      <input
                        type="number"
                        style={INPUT_STYLE}
                        placeholder="e.g. 38"
                        value={editingItem.threshold_max ?? ''}
                        onChange={e => setEditingItem(p => ({ ...p!, threshold_max: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingItem.photo_required ?? false}
                      onChange={e => setEditingItem(p => ({ ...p!, photo_required: e.target.checked }))}
                      style={{ accentColor: '#D97706', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>Require photo proof</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingItem.is_required ?? true}
                      onChange={e => setEditingItem(p => ({ ...p!, is_required: e.target.checked }))}
                      style={{ accentColor: '#D97706', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>Required field</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    onClick={() => setEditingItem(null)}
                    style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '10px 16px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItem}
                    disabled={saving || !editingItem.label?.trim()}
                    style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                  >
                    {saving ? 'Saving...' : 'Save Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
