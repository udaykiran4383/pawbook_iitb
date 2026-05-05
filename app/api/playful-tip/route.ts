import { NextResponse } from 'next/server';

const tips = [
  'Offer clean water near common resting spots.',
  'Share one happy memory in PawBook today.',
  'If you see a new animal, check existing profiles before adding.',
  'Carry a small packet of pet-safe biscuits on campus.',
  'Report injuries quickly and add exact location details.',
  'Take one clear photo that helps with identification.',
];

const badges = ['Care Hero', 'Paw Pal', 'Friend of Strays', 'Campus Kindness Star'];

export async function GET() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  const badge = badges[Math.floor(Math.random() * badges.length)];

  return NextResponse.json({
    tip,
    badge,
    date: new Date().toISOString(),
  });
}
