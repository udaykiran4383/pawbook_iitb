'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader } from 'lucide-react';
import { useImageStore } from '@/lib/image-store';

interface ImageUploadProps {
  animalId?: number;
  animalName?: string;
  onClose?: () => void;
  onImageUpload?: (imageUrl: string) => void;
}

export default function ImageUpload({ animalId = 0, animalName = 'your friend', onClose, onImageUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const addImage = useImageStore((state) => state.addImage);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newImage = {
        id: Math.random().toString(36).substr(2, 9),
        animalId,
        url: preview,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'You',
        likes: 0,
        caption: caption || `Photo of ${animalName}`,
      };

      addImage(animalId, newImage);
      console.log('[v0] Image uploaded for', animalName, ':', newImage.caption);
      
      // Reset
      setPreview(null);
      setCaption('');
      onClose?.();
    } catch (error) {
      console.error('[v0] Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl p-6 border-2 border-dashed border-pink-200">
      {!preview ? (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div className={`text-center py-8 cursor-pointer transition active:scale-95 ${isDragActive ? 'scale-105 bg-pink-100 border-pink-300' : 'hover:bg-pink-50'} rounded-2xl border-2 border-pink-200`}>
            <Upload size={48} className="mx-auto mb-3 text-pink-400" />
            <p className="text-foreground font-bold text-lg">Drop a photo here</p>
            <p className="text-muted-foreground text-sm">or click to select from gallery</p>
            <p className="text-xs text-muted-foreground mt-2">Show us {animalName}! 📸</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 active:scale-90 transition shadow-lg"
              title="Remove this photo"
            >
              <X size={20} className="text-foreground" />
            </button>
          </div>

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`Caption for ${animalName}... (optional)`}
            className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 focus:outline-none text-foreground placeholder-muted-foreground transition"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setPreview(null)}
              className="flex-1 border-2 border-pink-300 text-foreground font-bold py-3 rounded-full hover:bg-pink-50 active:scale-95 transition"
            >
              Choose Again
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
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
