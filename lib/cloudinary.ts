import { createHash } from 'crypto';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function cloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinaryConfig() {
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are missing.');
  }

  return {
    cloudName: cloudName as string,
    apiKey: apiKey as string,
    apiSecret: apiSecret as string,
  };
}

export function signCloudinaryParams(params: Record<string, string>, secret: string): string {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('sha1').update(`${serialized}${secret}`).digest('hex');
}
