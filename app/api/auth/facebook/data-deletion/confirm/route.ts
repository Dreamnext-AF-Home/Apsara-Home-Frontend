import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Missing confirmation code' },
      { status: 400 }
    );
  }

  // Simple confirmation page response
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Data Deletion Confirmation</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
      </style>
    </head>
    <body>
      <h1 class="success">Data Deletion Request Received</h1>
      <p>Your data deletion request has been received and is being processed.</p>
      <p>Confirmation code: <strong>${code}</strong></p>
      <p>You will receive a confirmation once the deletion is complete.</p>
      <p><a href="/">Return to AF Home</a></p>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
