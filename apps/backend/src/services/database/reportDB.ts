import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export interface SaveReportInput {
  userId: string;
  name: string;
  fileName: string;
  story: string;
  audience: string;
  reportStyle: 'executive' | 'story' | 'detailed';
  markdownContent: string;
  // csvData: any[]; // ❌ REMOVED: Don't store raw CSV data for security
  metadata: {
    rowCount: number;
    columns: string[];
  };
}

export interface Report {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  story: string;
  audience: string;
  reportStyle: string;
  markdownContent: string;
  // csvData: any; // ❌ REMOVED: Don't store raw CSV data
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save a report to the database (WITHOUT raw CSV data for security)
 */
export async function saveReport(input: SaveReportInput): Promise<Report> {
  const query = `
    INSERT INTO reports (
      user_id, name, file_name, story, audience,
      report_style, markdown_content, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id, user_id as "userId", name, file_name as "fileName",
      story, audience, report_style as "reportStyle",
      markdown_content as "markdownContent",
      metadata, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    input.userId,
    input.name,
    input.fileName,
    input.story,
    input.audience,
    input.reportStyle,
    input.markdownContent,
    JSON.stringify(input.metadata)
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get all reports for a user (summary only - no markdown content)
 */
export async function getUserReports(userId: string): Promise<Report[]> {
  const query = `
    SELECT
      id, user_id as "userId", name, file_name as "fileName",
      story, audience, report_style as "reportStyle",
      metadata, created_at as "createdAt", updated_at as "updatedAt"
    FROM reports
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Get a specific report by ID (includes full markdown content)
 */
export async function getReportById(reportId: string, userId: string): Promise<Report | null> {
  const query = `
    SELECT
      id, user_id as "userId", name, file_name as "fileName",
      story, audience, report_style as "reportStyle",
      markdown_content as "markdownContent",
      metadata, created_at as "createdAt", updated_at as "updatedAt"
    FROM reports
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [reportId, userId]);
  return result.rows[0] || null;
}

/**
 * Update a report
 */
export async function updateReport(
  reportId: string,
  userId: string,
  updates: Partial<SaveReportInput>
): Promise<Report | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.markdownContent !== undefined) {
    setClauses.push(`markdown_content = $${paramIndex++}`);
    values.push(updates.markdownContent);
  }
  if (updates.reportStyle !== undefined) {
    setClauses.push(`report_style = $${paramIndex++}`);
    values.push(updates.reportStyle);
  }

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(reportId, userId);

  const query = `
    UPDATE reports
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING
      id, user_id as "userId", name, file_name as "fileName",
      story, audience, report_style as "reportStyle",
      markdown_content as "markdownContent",
      metadata, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  const query = `
    DELETE FROM reports
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;

  const result = await pool.query(query, [reportId, userId]);
  return result.rowCount !== null && result.rowCount > 0;
}
