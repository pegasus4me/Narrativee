import { Router, Request, Response } from 'express';
import multer from 'multer';
import { generateReport } from '../services/LLM/grok';
import { parseCSV } from '../utils/csv/csvParser';
import { optionalAuth, verifyAuth, AuthRequest } from '../middleware/auth';
import { saveReport, getUserReports, getReportById, updateReport, deleteReport } from '../services/database/reportDB';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

    // Parse CSV
    console.log('📊 Parsing CSV...');
    const csvData = await parseCSV(file.buffer.toString('utf-8'));
    console.log(`✅ Parsed ${csvData.length} rows`);

    // Generate report template using Grok
    console.log('🤖 Generating report template...');
    const template = await generateReport({
      csvData,
      story,
      audience,
      reportStyle,
      fileName: file.originalname
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

export default router;
