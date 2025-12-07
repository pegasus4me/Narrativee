import { Router, Response } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { powerBIService } from '../integrations/powerbi/powerbi.service';

const router = Router();

// List workspaces
router.get('/workspaces', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const workspaces = await powerBIService.listWorkspaces(req.user.id);
        console.log("workspaces", workspaces);
        return res.json({ success: true, workspaces });
    } catch (error: any) {
        console.error('Error fetching workspaces:', error);
        return res.status(500).json({
            error: 'Failed to fetch workspaces',
            message: error.message
        });
    }
});

// List datasets
router.get('/datasets', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const workspaceId = req.query.workspaceId as string | undefined;
        const datasets = await powerBIService.listDatasets(req.user.id, workspaceId);

        return res.json({ success: true, datasets });
    } catch (error: any) {
        console.error('Error fetching datasets:', error);
        return res.status(500).json({
            error: 'Failed to fetch datasets',
            message: error.message
        });
    }
});

// Get dataset details (add this route)
router.get('/datasets/:datasetId', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { datasetId } = req.params;
        const workspaceId = req.query.workspaceId as string;
        console.log("workspaceId AHAHAHAHAHA ===============================", workspaceId);
        const details = await powerBIService.getDatasetDetails(req.user.id, datasetId, workspaceId);
        const datasources = await powerBIService.getDatasetDatasources(req.user.id, datasetId, workspaceId);
        const refreshHistory = await powerBIService.getDatasetRefreshHistory(req.user.id, datasetId, workspaceId);

        return res.json({
            success: true,
            details,
            datasources,
            refreshHistory
        });
    } catch (error: any) {
        console.error('Error fetching dataset details:', error);
        return res.status(500).json({
            error: 'Failed to fetch dataset details',
            message: error.message
        });
    }
});
// List Tables in a Dataset
router.get('/datasets/:datasetId/tables', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log("workspaceId safoan =============", req.query);
        const { datasetId } = req.params;
        const workspaceId = req.query.workspaceId as string;
        console.log("workspaceId safoan ===============================", workspaceId);

        if (!datasetId) {
            return res.status(400).json({ error: 'Missing datasetId' });
        }

        const tables = await powerBIService.getDatasetTables(req.user.id, datasetId, workspaceId);

        return res.json({ success: true, tables });
    } catch (error: any) {
        console.error('Error listing tables:', error);
        return res.status(500).json({
            error: 'Failed to fetch tables',
            message: error.message
        });
    }
});

// Execute DAX Query
router.post('/query', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { datasetId, workspaceId, query } = req.body;

        if (!datasetId || !query) {
            return res.status(400).json({ error: 'Missing datasetId or query' });
        }

        const result = await powerBIService.executeDAX(req.user.id, datasetId, query, workspaceId);

        return res.json({ success: true, result });
    } catch (error: any) {
        console.error('Error executing DAX query:', error);
        return res.status(500).json({
            error: 'Failed to execute DAX query',
            message: error.message
        });
    }
});

// Temporary test route
router.get('/test-parsing', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { datasetId, tableName, workspaceId, format } = req.query;

        if (!datasetId || !tableName) {
            return res.status(400).json({ error: 'Missing datasetId or tableName' });
        }

        const data = await powerBIService.getDataForLLM(
            req.user.id,
            datasetId as string,
            tableName as string,
            workspaceId as string,
            (format as 'csv' | 'markdown') || 'csv'
        );

        return res.send(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// List reports
router.get('/reports', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const workspaceId = req.query.workspaceId as string | undefined;
        const reports = await powerBIService.listReports(req.user.id, workspaceId);
        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get report embed config
router.get('/reports/:reportId/config', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { reportId } = req.params;
        const workspaceId = req.query.workspaceId as string | undefined;

        const config = await powerBIService.getReportConfig(req.user.id, reportId, workspaceId);
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
