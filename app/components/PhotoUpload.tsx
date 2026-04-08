'use client'

import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

type PhotoUploadProps = {
  taskId: string
  onPhotoUploaded: (taskId: string, photoUrl: string) => void
  onPhotoOffline?: (taskId: string, blob: Blob, mimeType: string) => Promise<void>
  currentPhotoUrl?: string
}

export default function PhotoUpload({ taskId, onPhotoUploaded, onPhotoOffline, currentPhotoUrl }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // ── Offline path: queue to IndexedDB ──────────────────────────────────
    if (!navigator.onLine && onPhotoOffline) {
      await onPhotoOffline(taskId, file, file.type || 'image/jpeg')
      return
    }

    // Upload to Supabase Storage
    setUploading(true)
    setError(null)

    try {
      const fileName = `${taskId}-${Date.now()}.jpg`
      const { data, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload photo. Please try again.')
        setUploading(false)
        return
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      const publicUrl = publicData?.publicUrl
      if (!publicUrl) {
        setError('Failed to get photo URL. Please try again.')
        setUploading(false)
        return
      }

      onPhotoUploaded(taskId, publicUrl)
      setUploading(false)
    } catch (err) {
      console.error('Upload exception:', err)
      setError('An error occurred while uploading. Please try again.')
      setUploading(false)
    }
  }

  const handleCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#DC2626' }}>⚠</span>
          <span
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              color: '#DC2626',
            }}
          >
            {error}
          </span>
        </div>
      )}

      {preview ? (
        <div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '180px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <img
              src={preview}
              alt="Task photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
              <button
                onClick={handleCapture}
                disabled={uploading}
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1,
                }}
              >
                {uploading ? 'Uploading...' : 'Retake'}
              </button>
            </div>
          </div>
          {!uploading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                color: '#D97706',
              }}
            >
              <span>&#10003;</span>
              <span>Photo attached</span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleCapture}
          disabled={uploading}
          className="hover:opacity-80 transition-opacity"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            background: 'rgba(217,119,6,0.06)',
            border: '1px dashed rgba(217,119,6,0.3)',
            borderRadius: '4px',
            padding: '12px 16px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: '20px' }}>&#128247;</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#D97706' }}>
              {uploading ? 'Uploading...' : 'Take Photo'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 300, color: '#A89880' }}>
              Proof of completion
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
