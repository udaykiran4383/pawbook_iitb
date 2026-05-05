'use client';

import { useState } from 'react';
import { Heart, Trash2, Plus, X } from 'lucide-react';
import { useImageStore } from '@/lib/image-store';
import ImageUpload from './image-upload';

interface ImageGalleryProps {
  animalId: number;
  animalName: string;
}

const EMPTY_IMAGES: any[] = [];

export default function ImageGallery({ animalId, animalName }: ImageGalleryProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const images = useImageStore((state) => state.images[animalId] || EMPTY_IMAGES);
  const removeImage = useImageStore((state) => state.removeImage);
  const likeImage = useImageStore((state) => state.likeImage);

  const handleLike = (imageId: string) => {
    setLikedImages(prevLiked => {
      const newSet = new Set(prevLiked);
      if (!newSet.has(imageId)) {
        newSet.add(imageId);
        likeImage(animalId, imageId);
      }
      return newSet;
    });
  };

  const handleDelete = (imageId: string) => {
    removeImage(animalId, imageId);
    console.log('[v0] Image deleted:', imageId);
  };

  if (images.length === 0 && !showUpload) {
    return (
      <button
        onClick={() => setShowUpload(true)}
        className="w-full bg-gradient-to-r from-pink-100 to-orange-100 hover:from-pink-200 hover:to-orange-200 active:scale-95 border-2 border-dashed border-pink-300 rounded-2xl py-4 text-foreground font-bold flex items-center justify-center gap-2 transition"
      >
        <Plus size={24} />
        Add Photos of {animalName}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id} className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition border-2 border-white/50">
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-40 object-cover group-hover:scale-110 transition cursor-pointer"
                  onClick={() => setSelectedImage(image.id)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleLike(image.id)}
                    className="bg-white rounded-full p-3 hover:bg-pink-100 active:scale-95 transition shadow-lg"
                    title="Like this photo"
                  >
                    <Heart
                      size={20}
                      className={likedImages.has(image.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="bg-white rounded-full p-3 hover:bg-red-100 active:scale-95 transition shadow-lg"
                    title="Delete photo"
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                  <p className="text-white text-sm font-bold truncate">{image.caption}</p>
                  <p className="text-white/80 text-xs mt-1">❤️ {image.likes} {image.likes === 1 ? 'like' : 'likes'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex-1 border-2 border-pink-200 text-foreground font-bold py-3 rounded-full hover:bg-pink-50 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add More Photos
            </button>
          </div>
        </>
      )}

      {showUpload && (
        <ImageUpload animalId={animalId} animalName={animalName} onClose={() => setShowUpload(false)} />
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 active:scale-95 transition"
            >
              <X size={32} />
            </button>
            <img
              src={images.find(img => img.id === selectedImage)?.url}
              alt="Full size"
              className="w-full h-auto rounded-2xl"
            />
            <div className="mt-4 bg-white rounded-xl p-4 shadow-lg">
              <p className="font-bold text-foreground mb-2">{images.find(img => img.id === selectedImage)?.caption}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLike(selectedImage)}
                  className="flex-1 bg-pink-100 hover:bg-pink-200 active:scale-95 text-pink-600 font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Heart size={18} className={likedImages.has(selectedImage) ? 'fill-pink-500 text-pink-500' : ''} />
                  {images.find(img => img.id === selectedImage)?.likes} Likes
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedImage);
                    setSelectedImage(null);
                  }}
                  className="flex-1 bg-red-100 hover:bg-red-200 active:scale-95 text-red-600 font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
