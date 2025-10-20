import { NextRequest, NextResponse } from 'next/server';

// This endpoint is designed to be triggered by Vercel Cron or similar
// Configure in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/daily-analytics",
//     "schedule": "0 2 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('⏰ Cron job triggered: daily analytics');

    // Call the aggregation endpoint
    const aggregationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/aggregate-daily`;
    const response = await fetch(aggregationUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aggregation failed:', errorText);
      return NextResponse.json(
        { error: 'Aggregation failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Daily analytics cron completed:', result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For platforms that use POST for cron jobs
export async function POST(request: NextRequest) {
  return GET(request);
}
