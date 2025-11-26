import Papa from 'papaparse';

export interface CSVRow {
  [key: string]: string | number;
}

export async function parseCSV(csvContent: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data as CSVRow[]);
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}
