'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getVendors,
  getCategories,
  createVendor,
  updateVendor,
  deleteVendor,
  type VendorWithCategory,
  type RMCategory,
  type VendorContact,
} from '@/lib/maintenance'

const LABEL_STYLE = {
  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
  fontSize: '11px',
  fontWeight: 500 as const,
  color: '#6B5B4E',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  display: 'block' as const,
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

type VendorForm = {
  name: string
  company: string
  phone: string
  email: string
  notes: string
  category_id: string | null
}

const EMPTY_FORM: VendorForm = {
  name: '',
  company: '',
  phone: '',
  email: '',
  notes: '',
  category_id: null,
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorWithCategory[]>([])
  const [categories, setCategories] = useState<RMCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<VendorForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const load = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([getVendors(), getCategories()])
      setVendors(v)
      setCategories(c)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (vendor: VendorWithCategory) => {
    setForm({
      name: vendor.name,
      company: vendor.company ?? '',
      phone: vendor.phone ?? '',
      email: vendor.email ?? '',
      notes: vendor.notes ?? '',
      category_id: vendor.category_id,
    })
    setEditingId(vendor.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
        category_id: form.category_id,
      }
      if (editingId) {
        await updateVendor(editingId, payload)
      } else {
        await createVendor(payload)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Remove this vendor contact?')) return
    try {
      await deleteVendor(vendorId)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const filtered = filterCategory === 'all'
    ? vendors
    : filterCategory === 'uncategorized'
    ? vendors.filter(v => !v.category_id)
    : vendors.filter(v => v.category_id === filterCategory)

  // Group by category for display
  const grouped: Record<string, VendorWithCategory[]> = {}
  for (const v of filtered) {
    const key = v.r_m_categories?.name ?? 'Uncategorized'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(v)
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/maintenance" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A89880', textDecoration: 'none' }}>
                ← R&amp;M
              </Link>
              <h1
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#F5F0E8',
                }}
              >
                Vendor Contacts
              </h1>
            </div>
            <button
              onClick={openNew}
              className="hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
            >
              + Add Vendor
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', ...categories.map(c => c.id), 'uncategorized'].map((id) => {
            const label = id === 'all' ? 'All' : id === 'uncategorized' ? 'Uncategorized' : categories.find(c => c.id === id)?.name ?? id
            return (
              <button
                key={id}
                onClick={() => setFilterCategory(id)}
                style={{
                  fontFamily: 'var(--font-dmsans)',
                  fontSize: '12px',
                  fontWeight: filterCategory === id ? 500 : 400,
                  color: filterCategory === id ? '#1C1917' : '#6B5B4E',
                  background: filterCategory === id ? '#D97706' : '#FFFFFF',
                  border: filterCategory === id ? '1px solid #D97706' : '1px solid #E8E3DC',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', padding: '48px', textAlign: 'center' }}>Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '16px' }}>No vendors yet. Add your first vendor contact.</p>
            <button
              onClick={openNew}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
            >
              Add vendor
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([catName, catVendors]) => (
            <section key={catName}>
              <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                {catName}
              </h2>
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', overflow: 'hidden' }}>
                {catVendors.map((vendor, idx) => (
                  <div
                    key={vendor.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx < catVendors.length - 1 ? '1px solid #F0EBE3' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#1C1917', marginBottom: '4px' }}>
                        {vendor.name}
                        {vendor.company && (
                          <span style={{ fontSize: '13px', fontWeight: 400, color: '#78716C', marginLeft: '8px' }}>{vendor.company}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {vendor.phone && (
                          <a
                            href={`tel:${vendor.phone}`}
                            style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', textDecoration: 'none' }}
                          >
                            {vendor.phone}
                          </a>
                        )}
                        {vendor.email && (
                          <a
                            href={`mailto:${vendor.email}`}
                            style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', textDecoration: 'none' }}
                          >
                            {vendor.email}
                          </a>
                        )}
                      </div>
                      {vendor.notes && (
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                          {vendor.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(vendor)}
                        style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Vendor Form Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '20px', fontWeight: 600, color: '#1C1917', marginBottom: '24px' }}>
              {editingId ? 'Edit Vendor' : 'Add Vendor'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LABEL_STYLE}>Contact Name *</label>
                <input
                  style={INPUT_STYLE}
                  placeholder="e.g. John Rivera"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Company</label>
                <input
                  style={INPUT_STYLE}
                  placeholder="e.g. Metro Refrigeration Services"
                  value={form.company}
                  onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL_STYLE}>Phone</label>
                  <input
                    style={INPUT_STYLE}
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Email</label>
                  <input
                    style={INPUT_STYLE}
                    type="email"
                    placeholder="vendor@example.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Equipment Category</label>
                <select
                  style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                  value={form.category_id ?? ''}
                  onChange={e => setForm(p => ({ ...p, category_id: e.target.value || null }))}
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Notes (optional)</label>
                <textarea
                  style={{ ...INPUT_STYLE, minHeight: '68px', resize: 'vertical' }}
                  placeholder="e.g. 24/7 emergency line, usually 2-hour response"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
