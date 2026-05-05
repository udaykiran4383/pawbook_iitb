import { NextResponse } from 'next/server';
import { getCloudinaryConfig, signCloudinaryParams } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const folderInput = formData.get('folder');
    const folder = typeof folderInput === 'string' && folderInput.trim() ? folderInput.trim() : 'pawbook';

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = { folder, timestamp };
    const signature = signCloudinaryParams(paramsToSign, apiSecret);

    const uploadPayload = new FormData();
    uploadPayload.append('file', image);
    uploadPayload.append('api_key', apiKey);
    uploadPayload.append('timestamp', timestamp);
    uploadPayload.append('folder', folder);
    uploadPayload.append('signature', signature);

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadPayload,
    });

    const result = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok) {
      return NextResponse.json({ error: result?.error?.message || 'Cloudinary upload failed' }, { status: 500 });
    }

    return NextResponse.json(
      {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown upload error' }, { status: 500 });
  }
}
