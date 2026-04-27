import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { spreadsheetId, gid, data } = body

    if (!spreadsheetId || !data) {
      return NextResponse.json({ error: 'Missing spreadsheetId or data' }, { status: 400 })
    }

    const sheetGid = gid || '0'
    
    // Convert data to CSV format for Google Sheets
    const headers = Object.keys(data[0] || {})
    const csvRows = [
      headers.join(','),
      ...data.map((row: any) => 
        headers.map(header => {
          const value = row[header]
          // Handle strings with commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        }).join(',')
      )
    ]
    const csvContent = csvRows.join('\n')

    // For now, we'll return the CSV content with instructions
    // In production, you would use Google Sheets API with OAuth/service account
    return NextResponse.json({
      success: true,
      message: 'Data prepared for spreadsheet',
      csvContent,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${sheetGid}`,
      instructions: 'Copy the CSV content below and paste it into your Google Sheet'
    })
  } catch (error) {
    console.error('Error pushing to spreadsheet:', error)
    return NextResponse.json({ error: 'Failed to push data to spreadsheet' }, { status: 500 })
  }
}
