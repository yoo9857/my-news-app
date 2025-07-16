import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_STOCK_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/api/log_visit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': request.headers.get('user-agent') || 'unknown',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error from backend" }));
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
            { success: false, error: "Could not connect to backend service." },
            { status: 503 }
        );
    }
    return NextResponse.json(
      { success: false, error: "An internal error occurred." },
      { status: 500 }
    );
  }
}