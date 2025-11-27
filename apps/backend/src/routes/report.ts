import { Router, Request, Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { generateReport } from '../services/LLM/llm';
import { parseCSV } from '../utils/csv/csvParser';
import { optionalAuth, verifyAuth, AuthRequest } from '../middleware/auth';
import { saveReport, getUserReports, getReportById, updateReport, deleteReport, generateShareLink, getSharedReport } from '../services/database/reportDB';
import { REPORT_LIMITS } from '../config/llm.config';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Cookie name for tracking anonymous report generation
const ANONYMOUS_REPORT_COOKIE = 'narrativee_anon_report_generated';

// Generate report from uploaded CSV (allows both authenticated and anonymous users)
router.post('/generate', optionalAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📥 Received report generation request');

    const file = req.file;
    const { story, audience, reportStyle } = req.body;

    console.log('Request params:', {
      hasFile: !!file,
      fileName: file?.originalname,
      story: story?.substring(0, 50),
      audience,
      reportStyle,
      isAuthenticated: !!req.user
    });

    if (!file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!story || !audience || !reportStyle) {
      console.error('❌ Missing required fields:', { story: !!story, audience: !!audience, reportStyle: !!reportStyle });
      return res.status(400).json({ error: 'Story and audience are required' });
    }

    // Check if anonymous user already generated a report
    if (!req.user) {
      const hasGeneratedReport = req.cookies?.[ANONYMOUS_REPORT_COOKIE];

      if (hasGeneratedReport === 'true') {
        console.log('🚫 Anonymous user already generated 1 report');
        return res.status(403).json({
          error: 'Report limit reached',
          message: 'You can only generate 1 report without an account. Please sign in to create more reports.',
          requiresAuth: true,
          limit: REPORT_LIMITS.anonymous
        });
      }
    }

    // Parse CSV
    console.log('📊 Parsing CSV...');
    const csvData = await parseCSV(file.buffer.toString('utf-8'));
    console.log(`✅ Parsed ${csvData.length} rows`);

    // Generate report template with plan-based LLM selection
    console.log('🤖 Generating report template...');
    const template = await generateReport({
      csvData,
      story,
      audience,
      reportStyle,
      fileName: file.originalname,
      userPlan: req.user?.plan || null, // null = no auth
    });

    console.log('✅ Template generated:', {
      id: template.id,
      name: template.name,
      hasMarkdown: !!template.markdown
    });

    // If user is authenticated, save to database (WITHOUT raw CSV data for security)
    let savedReport = null;
    if (req.user) {
      console.log('💾 Saving report to database for user:', req.user.id);
      try {
        savedReport = await saveReport({
          userId: req.user.id,
          name: template.name,
          fileName: file.originalname,
          story,
          audience,
          reportStyle,
          markdownContent: template.markdown,
          // csvData, // ❌ NOT stored for security reasons
          metadata: {
            rowCount: csvData.length,
            columns: csvData.length > 0 ? Object.keys(csvData[0]) : []
          }
        });
        console.log('✅ Report saved with ID:', savedReport.id, '(raw CSV data NOT stored for security)');
      } catch (dbError) {
        console.error('❌ Failed to save report to database:', dbError);
        // Continue anyway - return the template even if DB save fails
      }
    }

    const response = {
      success: true,
      template,
      reportId: savedReport?.id, // Include DB ID if saved
      metadata: {
        fileName: file.originalname,
        rowCount: csvData.length,
        columns: csvData.length > 0 ? Object.keys(csvData[0]) : []
      }
    };

    // Set cookie to track anonymous report generation (30 days expiry)
    if (!req.user) {
      res.cookie(ANONYMOUS_REPORT_COOKIE, 'true', {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      console.log('🍪 Set anonymous report cookie (1/1 reports used)');
    }

    console.log('📤 Sending response');
    return res.json(response);

  } catch (error: any) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

// Get all reports for authenticated user
router.get('/my-reports', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reports = await getUserReports(req.user.id);
    return res.json({ success: true, reports });
  } catch (error: any) {
    console.error('Error fetching user reports:', error);
    return res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

// Get specific report by ID
router.get('/:reportId', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reportId } = req.params;
    const report = await getReportById(reportId, req.user.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return res.status(500).json({
      error: 'Failed to fetch report',
      message: error.message
    });
  }
});

// Update specific report by ID
router.put('/:reportId', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reportId } = req.params;
    const { name, markdownContent, reportStyle } = req.body;

    const updatedReport = await updateReport(reportId, req.user.id, {
      name,
      markdownContent,
      reportStyle
    });

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found or unauthorized' });
    }

    return res.json({ success: true, report: updatedReport });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return res.status(500).json({
      error: 'Failed to update report',
      message: error.message
    });
  }
});

// Delete specific report by ID
router.delete('/:reportId', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reportId } = req.params;
    const deleted = await deleteReport(reportId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Report not found or unauthorized' });
    }

    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return res.status(500).json({
      error: 'Failed to delete report',
      message: error.message
    });
  }
});

// Migrate localStorage report to database
router.post('/migrate', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, fileName, markdownContent, metadata } = req.body;

    if (!name || !fileName || !markdownContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📦 Migrating localStorage report for user:', req.user.id);

    // Save to database
    const report = await saveReport({
      userId: req.user.id,
      name,
      fileName,
      story: 'Migrated from localStorage',
      audience: 'General',
      reportStyle: 'executive',
      markdownContent,
      metadata: metadata || {}
    });

    console.log('✅ Report migrated with ID:', report.id);

    return res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error migrating report:', error);
    return res.status(500).json({
      error: 'Failed to migrate report',
      message: error.message
    });
  }
});

// Generate share link for a report
router.post('/:reportId/share', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reportId } = req.params;

    console.log('📤 Generating share link for report:', reportId);

    // Generate unique share ID (10 characters, URL-safe)
    const shareId = nanoid(10);

    // Update report with share ID
    const report = await generateShareLink(reportId, req.user.id, shareId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found or unauthorized' });
    }

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareId}`;

    console.log('✅ Share link generated:', shareUrl);

    return res.json({
      success: true,
      shareUrl,
      shareId: report.shareId
    });
  } catch (error: any) {
    console.error('Error generating share link:', error);
    return res.status(500).json({
      error: 'Failed to generate share link',
      message: error.message
    });
  }
});

// Get shared report (public access, no auth)
router.get('/share/:shareId', async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;

    console.log('🔍 Fetching shared report:', shareId);

    const report = await getSharedReport(shareId);

    if (!report) {
      return res.status(404).json({ error: 'Shared report not found' });
    }

    console.log('✅ Shared report found:', report.id);

    return res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('Error fetching shared report:', error);
    return res.status(500).json({
      error: 'Failed to fetch shared report',
      message: error.message
    });
  }
});

export default router;
