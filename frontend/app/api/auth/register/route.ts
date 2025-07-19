import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/register`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email, // Backend expects 'username'
        email: email,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`Backend Register API Error: ${response.status} - ${response.statusText}, Body:`, errorBody);
      return NextResponse.json({ error: errorBody.detail || 'Registration failed' }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      message: 'Registration successful',
      user: data,
    }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}