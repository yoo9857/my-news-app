
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// --- 1. Environment Variable for Security ---
// It's crucial to use an environment variable for the JWT secret.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables. Please add it to your .env.local file.');
}

export async function POST(req: NextRequest) {
  try {
    // --- 2. Input Validation (Implicitly handled by client-side Zod) ---
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // --- 3. Database User Lookup ---
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // Use a generic error message to prevent email enumeration attacks
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];

    // --- 4. Password Verification ---
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- 5. JWT Generation ---
    // The token payload should be minimal and not contain sensitive data.
    const payload = {
      userId: user.id,
      email: user.email,
      // Add other non-sensitive data if needed, e.g., roles
    };

    const access_token = jwt.sign(payload, JWT_SECRET!, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // --- 6. Successful Response ---
    return NextResponse.json({
      message: 'Login successful',
      access_token: access_token
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
