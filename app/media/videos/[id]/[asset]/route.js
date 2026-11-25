import { serveVideoMedia } from '@/lib/video-media.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) { return serveVideoMedia(request, await params); }
export async function HEAD(request, { params }) { return serveVideoMedia(request, await params); }
