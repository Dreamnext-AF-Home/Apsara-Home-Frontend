import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function columnToLetter(col: number): string {
  let letter = ''
  while (col > 0) {
    const remainder = (col - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    col = Math.floor((col - 1) / 26)
  }
  return letter
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { spreadsheetId, gid, data } = body

    if (!spreadsheetId || !data) {
      return NextResponse.json({ error: 'Missing spreadsheetId or data' }, { status: 400 })
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data must be a non-empty array' }, { status: 400 })
    }

    // Get service account credentials from environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    console.log('Service account email:', serviceAccountEmail)
    console.log('Private key length:', privateKey?.length)
    console.log('Private key starts with:', privateKey?.substring(0, 20))

    if (!serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Missing Google service account credentials in environment variables (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)' },
        { status: 500 }
      )
    }

    // Authenticate with Google Sheets API
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: SCOPES,
    })

    // Authorize the client to catch authentication errors early
    try {
      await auth.authorize()
    } catch (authError) {
      console.error('Google authentication error:', authError)
      return NextResponse.json(
        { error: 'Google authentication failed', details: authError instanceof Error ? authError.message : 'Unknown auth error' },
        { status: 500 }
      )
    }

    const sheets = google.sheets({ version: 'v4', auth })

    // Convert data to array of arrays for Google Sheets
    const headers = Object.keys(data[0])
    const lastCol = columnToLetter(headers.length)
    const rows = data.map((row: any) =>
      headers.map(header => {
        const value = row[header]
        return value !== null && value !== undefined ? String(value) : ''
      })
    )

    // Clear existing data in the sheet
    const sheetGid = gid || '0'
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `EXPORTED DATA!A:${lastCol}`,
    })

    // Write new data to the sheet
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `EXPORTED DATA!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers, ...rows]
      }
    })

    // Read back the data from the spreadsheet to show real-time data in modal
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `EXPORTED DATA!A:${lastCol}`,
    })

    const spreadsheetData = readResponse.data.values || []

    return NextResponse.json({
      success: true,
      message: 'Data successfully pushed to spreadsheet',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${sheetGid}`,
      updatedRows: spreadsheetData.length,
      updatedColumns: spreadsheetData[0]?.length || 0,
      data: spreadsheetData // Real-time data from spreadsheet for modal display
    })
  } catch (error) {
    console.error('Error pushing to spreadsheet:', error)
    return NextResponse.json(
      { error: 'Failed to push data to spreadsheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
