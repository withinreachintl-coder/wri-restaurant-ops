'use client'

import { useState, useRef } from 'react'

type PhotoUploadProps = {
  taskId: string
  onPhotoUploaded: (taskId: string, photoUrl: string) => void
  currentPhotoUrl?: string
}

export default function PhotoUpload({ taskId, onPhotoUploaded, currentPhotoUrl }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // TODO: Upload to actual storage (S3, Cloudflare R2, etc.)
    setUploading(true)
    
    // Simulate upload delay
    setTimeout(() => {
      const fakeUrl = `https://storage.wireach.tools/photos/${taskId}-${Date.now()}.jpg`
      onPhotoUploaded(taskId, fakeUrl)
      setUploading(false)
    }, 1000)
  }

  const handleCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-2">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Task photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={handleCapture}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Retake
              </button>
            </div>
          </div>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <span>✓</span>
            <span>Photo attached</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleCapture}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors w-full disabled:opacity-50"
        >
          <span className="text-2xl">📷</span>
          <div className="text-left">
            <div className="text-sm font-medium text-blue-700">
              {uploading ? 'Uploading...' : 'Take Photo'}
            </div>
            <div className="text-xs text-blue-600">
              Proof of completion
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
