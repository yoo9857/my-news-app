import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql`
      SELECT * FROM daily_stock_data
      WHERE code = ${code}
      ORDER BY date DESC
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found for the given stock code' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching daily stock data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
