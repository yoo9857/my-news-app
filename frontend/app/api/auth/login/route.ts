import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Prepare form data for the backend FastAPI endpoint
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI expects 'username' for OAuth2PasswordRequestForm
    formData.append('password', password);

    const backendUrl = `http://localhost:8002/api/token`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`Backend Login API Error: ${response.status} - ${response.statusText}, Body:`, errorBody);
      return NextResponse.json({ error: errorBody.detail || 'Login failed' }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      message: 'Login successful',
      access_token: data.access_token, // Extract access_token from backend response
      token_type: data.token_type,
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}