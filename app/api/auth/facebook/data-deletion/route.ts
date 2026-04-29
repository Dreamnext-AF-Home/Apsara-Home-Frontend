import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signed_request } = body;

    if (!signed_request) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      );
    }

    // Parse Facebook's signed request
    const [encodedPayload, encodedSignature] = signed_request.split('.');
    
    if (!encodedPayload || !encodedSignature) {
      return NextResponse.json(
        { error: 'Invalid signed_request format' },
        { status: 400 }
      );
    }

    // Decode the payload
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64').toString('utf-8')
    );

    const { user_id } = payload;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id in signed_request' },
        { status: 400 }
      );
    }

    // TODO: Implement your data deletion logic here
    // This should delete or anonymize user data associated with the Facebook user_id
    // You might need to:
    // 1. Find the user account linked to this Facebook ID
    // 2. Delete their personal data from your database
    // 3. Keep only essential transactional data if required by law
    
    console.log(`Data deletion request for Facebook user: ${user_id}`);

    // Facebook expects a confirmation URL
    const confirmationCode = `fb_del_${user_id}_${Date.now()}`;
    
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/facebook/data-deletion/confirm?code=${confirmationCode}`,
      confirmation_code: confirmationCode
    });

  } catch (error) {
    console.error('Facebook data deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint only supports POST requests' },
    { status: 405 }
  );
}
