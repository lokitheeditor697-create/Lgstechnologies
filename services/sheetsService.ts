// @ts-nocheck
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Initialize the sheet
// Uses Service Account credentials from ENV
export async function getSheet() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '');
    
    // Auth using Service Account
    // Handle cases where the private key might have literal '\n' instead of actual newlines
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!privateKey || !clientEmail) {
      console.warn('Google Sheets API credentials missing. Skipping Sheets sync.');
      return null;
    }

    await doc.useServiceAccountAuth({
      client_email: clientEmail,
      private_key: privateKey,
    });

    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByIndex[0]; // get the first tab
    return sheet;
  } catch (error) {
    console.error('Error connecting to Google Sheets:', error);
    return null;
  }
}

/**
 * Appends a new registration row to the Google Sheet
 */
export async function appendRegistrationRow(data: {
  date: string,
  name: string,
  email: string,
  college: string,
  domain: string,
  status: string
}) {
  try {
    const sheet = await getSheet();
    if (!sheet) return;

    await sheet.addRow({
      'Date': data.date,
      'Name': data.name,
      'Email': data.email,
      'College': data.college,
      'Domain': data.domain,
      'Status': data.status,
      'Task Link': '',
      'Certificate Link': ''
    });
    console.log(`Appended row for ${data.email} to Google Sheets`);
  } catch (error) {
    console.error('Error appending row to Google Sheets:', error);
  }
}

/**
 * Updates an existing row by searching for the user's email
 */
export async function updateRegistrationRow(
  email: string, 
  updates: {
    status?: string,
    taskLink?: string,
    certificateLink?: string
  }
) {
  try {
    const sheet = await getSheet();
    if (!sheet) return;

    // Get all rows
    const rows = await sheet.getRows();
    
    // Find the row matching the email
    // Reverse loop to find the most recent entry if there are duplicates
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (row['Email'] === email) {
        // Update fields if provided
        if (updates.status) row['Status'] = updates.status;
        if (updates.taskLink) row['Task Link'] = updates.taskLink;
        if (updates.certificateLink) row['Certificate Link'] = updates.certificateLink;
        
        await row.save();
        console.log(`Updated row for ${email} in Google Sheets`);
        return;
      }
    }
    console.log(`Could not find row for email: ${email} to update.`);
  } catch (error) {
    console.error('Error updating row in Google Sheets:', error);
  }
}

