import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_KIWOOM_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ success: false, error: 'Stock code is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/api/financials/${code}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error from backend" }));
      return NextResponse.json(
        { success: false, error: `Backend server error: ${errorData.detail || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    if (error instanceof TypeError) {
        return NextResponse.json(
            { success: false, error: "Could not connect to backend service. Please ensure it's running." },
            { status: 503 } // Service Unavailable
        );
    }
    return NextResponse.json(
      { success: false, error: "An internal error occurred while fetching stock details." },
      { status: 500 }
    );
  }
}
