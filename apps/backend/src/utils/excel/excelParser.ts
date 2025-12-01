import * as XLSX from 'xlsx';
import { CSVRow } from '../csv/csvParser';

export async function parseExcel(buffer: Buffer): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
        try {
            console.log('📊 Excel Parser: Received buffer of size:', buffer.length);
            const header = buffer.subarray(0, 8).toString('hex');
            console.log('📊 Buffer Header (hex):', header);

            let workbook;
            // Check for HTML signature (<!DOCTYPE or <html)
            // 3c21444f = <!DO
            // 3c68746d = <htm
            if (header.startsWith('3c21444f') || header.startsWith('3c68746d')) {
                console.log('⚠️ Detected HTML content in Excel file. Attempting to parse as string...');
                const htmlString = buffer.toString('utf-8');
                console.log('📄 HTML Content Preview:', htmlString.substring(0, 500));

                // Check if it's a valid data table
                if (!htmlString.toLowerCase().includes('<table')) {
                    throw new Error('The uploaded file appears to be a webpage (HTML) without a data table. Please ensure you uploaded the actual Excel/CSV file, not a download page.');
                }

                workbook = XLSX.read(htmlString, { type: 'string', cellDates: true });
            } else {
                workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
            }

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet) as CSVRow[];

            resolve(jsonData);
        } catch (error) {
            reject(error);
        }
    });
}
