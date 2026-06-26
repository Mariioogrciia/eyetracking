import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const files = fs.readdirSync(publicDir);
    const videos = files
      .filter(file => file.endsWith('.mp4') || file.endsWith('.webm'))
      .map(file => ({
        id: file,
        name: file,
        src: `/${file}`
      }));
    
    return NextResponse.json({ videos });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read public directory' }, { status: 500 });
  }
}
