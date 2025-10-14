import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { faithful } = await request.json();

    const cookieStore = await cookies();

    // Set the cookie with appropriate options
    cookieStore.set('faithful-preference', faithful ? 'true' : 'false', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting faithful preference cookie:', error);
    return NextResponse.json({ error: 'Failed to set preference' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const faithfulPreference = cookieStore.get('faithful-preference');

    return NextResponse.json({
      faithful: faithfulPreference?.value === 'true',
    });
  } catch (error) {
    console.error('Error getting faithful preference cookie:', error);
    return NextResponse.json({ error: 'Failed to get preference' }, { status: 500 });
  }
}
