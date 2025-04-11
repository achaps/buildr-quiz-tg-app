import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, message, data, timestamp } = body;

    // Log to Vercel
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging:', error);
    return NextResponse.json({ success: false, error: 'Failed to log' }, { status: 500 });
  }
} 