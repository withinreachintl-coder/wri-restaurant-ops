'use client'

import { useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type PhotoUploadProps = {
  onPhotoUploaded: (url: string) => void
  taskId: string
  existingPhotoUrl?: string
}

export default function PhotoUpload({ onPhotoUploaded, taskId, existingPhotoUrl }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('Image must be smaller than 5MB')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${taskId}.${fileExt}`
      const filePath = `${fileName}`

      console.log('Uploading to Supabase:', filePath)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(data.path)

      console.log('Public URL:', publicUrl)

      onPhotoUploaded(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('File selected:', file)
    if (file) {
      uploadPhoto(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleCameraCapture = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Camera button clicked, triggering input')
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleGallerySelect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Gallery button clicked, triggering input')
    if (galleryInputRef.current) {
      galleryInputRef.current.click()
    }
  }

  if (existingPhotoUrl) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span>✓</span>
          <span>Photo attached</span>
          <a 
            href={existingPhotoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
        </div>
      )}

      {uploading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Uploading photo...</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCameraCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Take Photo</span>
          </button>

          <button
            type="button"
            onClick={handleGallerySelect}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Upload from Gallery</span>
          </button>
        </div>
      )}
    </div>
  )
}
