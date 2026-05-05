export async function uploadImageToCloudinary(file: File, folder = 'pawbook') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error || 'Image upload failed');
  }

  return payload.secure_url as string;
}
