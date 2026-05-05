'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, X, Loader } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadEnhancedProps {
  animalId: string;
  animalName: string;
  userId: string;
  onClose?: () => void;
  onSuccess?: (image: any) => void;
}

export default function ImageUploadEnhanced({
  animalId,
  animalName,
  userId,
  onClose,
  onSuccess,
}: ImageUploadEnhancedProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSource, setUploadSource] = useState<'camera' | 'gallery' | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handle dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
          setUploadSource('gallery');
        };
        reader.readAsDataURL(file);
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: false,
  });

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
        setUploadSource('camera');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle gallery selection
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
        setUploadSource('gallery');
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload to server
  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(preview);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, `${animalId}-${Date.now()}.jpg`);
      formData.append('animalId', animalId);
      formData.append('caption', caption);
      formData.append('userId', userId);

      console.log('[v0] Uploading image...');

      // Upload to API
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await uploadResponse.json();
      console.log('[v0] Image uploaded successfully:', data);

      // Reset form
      setPreview(null);
      setCaption('');
      setUploadSource(null);

      onSuccess?.(data.image);
      onClose?.();
    } catch (error: any) {
      console.error('[v0] Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!preview) {
    return (
      <div className="space-y-4">
        {/* Camera & Gallery Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-50 hover:bg-blue-100 active:scale-95 border-2 border-blue-300 rounded-2xl transition font-bold text-foreground"
          >
            <Camera size={32} className="text-blue-600" />
            <span>Take Photo</span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
          </button>

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-purple-50 hover:bg-purple-100 active:scale-95 border-2 border-purple-300 rounded-2xl transition font-bold text-foreground"
          >
            <ImageIcon size={32} className="text-purple-600" />
            <span>Choose Photo</span>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGallerySelect}
              className="hidden"
            />
          </button>
        </div>

        {/* Or Drag & Drop */}
        <div
          {...getRootProps()}
          className={`text-center py-8 rounded-2xl border-2 border-dashed transition cursor-pointer ${
            isDragActive
              ? 'bg-blue-100 border-blue-400'
              : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={32} className="mx-auto mb-2 text-gray-600" />
          <p className="font-bold text-foreground">Or drag & drop here</p>
          <p className="text-sm text-muted-foreground">jpg, png, gif, webp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
        <button
          onClick={() => {
            setPreview(null);
            setUploadSource(null);
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 active:scale-90 transition shadow-lg"
        >
          <X size={20} className="text-foreground" />
        </button>
        <div className="absolute top-2 left-2 bg-white rounded-full px-3 py-1 text-xs font-bold text-foreground shadow-lg">
          {uploadSource === 'camera' ? '📷 Camera' : '🖼️ Gallery'}
        </div>
      </div>

      {/* Caption */}
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={`Caption (optional) - e.g., "Playing near library"`}
        className="w-full px-4 py-3 border-2 border-accent rounded-full focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground placeholder-muted-foreground transition"
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setPreview(null);
            setUploadSource(null);
          }}
          className="flex-1 border-2 border-gray-300 text-foreground font-bold py-3 rounded-full hover:bg-gray-50 active:scale-95 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 disabled:opacity-50 active:scale-95 text-white font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload Photo
            </>
          )}
        </button>
      </div>
    </div>
  );
}
