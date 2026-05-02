import { NextRequest, NextResponse } from 'next/server';

// Note: This route is not currently used since terms acceptance is handled client-side
// in the LegalModal component. If server-side acceptance tracking is needed,
// this would require Firebase Admin SDK initialization.

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // TODO: Implement with Firebase Admin SDK when needed
    // For now, return success since acceptance is tracked client-side
    return NextResponse.json(
      { success: true, message: 'Terms acceptance recorded' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting terms:', error);
    return NextResponse.json(
      { error: 'Failed to accept terms' },
      { status: 500 }
    );
  }
}
