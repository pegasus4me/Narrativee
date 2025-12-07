import axios from "axios";
import { db } from "../../auth/auth";
import { account } from "../../auth/schema/schema";
import { eq, and } from "drizzle-orm";

import { PowerBIDataTransformer } from './powerbi.transformer';

export class PowerBIService {
    private static readonly TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    private static readonly API_BASE_URL = "https://api.powerbi.com/v1.0/myorg";

    /**
     * Retrieves a valid access token for the user.
     * Refreshes the token if it is expired or about to expire.
     */
    async getAccessToken(userId: string): Promise<string> {
        const userAccount = await db.query.account.findFirst({
            where: and(
                eq(account.userId, userId),
                eq(account.providerId, "microsoft")
            )
        });

        if (!userAccount) {
            throw new Error("PowerBI account not connected");
        }

        if (!userAccount.accessToken) {
            throw new Error("No access token found");
        }

        // Check if token is expired or expiring in less than 5 minutes
        const now = new Date();
        const expiryBuffer = 5 * 60 * 1000; // 5 minutes
        const expiresAt = userAccount.accessTokenExpiresAt ? new Date(userAccount.accessTokenExpiresAt) : new Date(0);

        // Check if the current token has the required PowerBI scopes
        // Azure AD v2 returns a token for only ONE resource (Graph OR PowerBI).
        // If we logged in with User.Read, the initial token is likely for Graph.
        // We need to exchange the refresh token to get a PowerBI token.
        const hasPowerBIScopes = userAccount.scope?.includes("Dataset.Read.All") || userAccount.scope?.includes("analysis.windows.net");

        if (now.getTime() + expiryBuffer > expiresAt.getTime() || !hasPowerBIScopes) {
            console.log("🔄 PowerBI token expired, expiring soon, or missing scopes. Refreshing...");
            return this.refreshAccessToken(userAccount);
        }

        return userAccount.accessToken;
    }

    /**
     * Refreshes the access token using the refresh token.
     */
    private async refreshAccessToken(userAccount: typeof account.$inferSelect): Promise<string> {
        if (!userAccount.refreshToken) {
            throw new Error("No refresh token available");
        }

        try {
            const params = new URLSearchParams();
            params.append("client_id", process.env.MICROSOFT_CLIENT_ID!);
            params.append("client_secret", process.env.MICROSOFT_CLIENT_SECRET!);
            params.append("scope", "offline_access https://analysis.windows.net/powerbi/api/Dataset.Read.All https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All https://analysis.windows.net/powerbi/api/Report.Read.All https://analysis.windows.net/powerbi/api/Workspace.Read.All User.Read");
            params.append("refresh_token", userAccount.refreshToken);
            params.append("grant_type", "refresh_token");

            const response = await axios.post(PowerBIService.TOKEN_ENDPOINT, params, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            const { access_token, refresh_token, expires_in } = response.data;

            // Update database with new tokens
            const newExpiresAt = new Date(Date.now() + expires_in * 1000);

            await db.update(account)
                .set({
                    accessToken: access_token,
                    refreshToken: refresh_token || userAccount.refreshToken, // Keep old refresh token if new one not provided
                    accessTokenExpiresAt: newExpiresAt,
                    updatedAt: new Date(),
                    // IMPORTANT: Update the scope in the DB so we don't keep refreshing!
                    scope: "offline_access https://analysis.windows.net/powerbi/api/Dataset.Read.All https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All https://analysis.windows.net/powerbi/api/Report.Read.All https://analysis.windows.net/powerbi/api/Workspace.Read.All User.Read"
                })
                .where(eq(account.id, userAccount.id));

            console.log("✅ PowerBI token refreshed successfully");
            return access_token;
        } catch (error) {
            console.error("❌ Failed to refresh PowerBI token:", error);
            throw new Error("Failed to refresh authentication token");
        }
    }

    /**
     * Lists all workspaces (groups) the user has access to.
     */
    async listWorkspaces(userId: string) {
        const token = await this.getAccessToken(userId);

        try {
            const response = await axios.get(`${PowerBIService.API_BASE_URL}/groups`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const workspaces = response.data.value;
            // Prepend "My Workspace" which is not returned by /groups
            return [
                { id: "", name: "My Workspace", isReadOnly: false, isOnDedicatedCapacity: false },
                ...workspaces
            ];
        } catch (error: any) {
            console.error("Error listing workspaces:", error.response?.data || error.message);
            throw new Error(`Failed to fetch workspaces: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Lists datasets. If workspaceId is provided, lists from that workspace.
     * Otherwise, lists from 'My Workspace'.
     */
    async listDatasets(userId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);
        console.log("workspaceId safoan ===============================", workspaceId);
        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets`
                : `${PowerBIService.API_BASE_URL}/datasets`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Datasets:", response.data.value);
            return response.data.value;
        } catch (error) {
            console.error("Error listing datasets:", error);
            throw new Error("Failed to fetch datasets");
        }
    }

    /**
     * Fetches tables from a specific dataset.
     */
    /**
     * Get detailed information about a dataset
     */
    async getDatasetDetails(userId: string, datasetId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);

        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}`
                : `${PowerBIService.API_BASE_URL}/datasets/${datasetId}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const dataset = response.data;

            console.log("📊 Dataset Details:", {
                id: dataset.id,
                name: dataset.name,
                configuredBy: dataset.configuredBy,
                isRefreshable: dataset.isRefreshable,
                isEffectiveIdentityRequired: dataset.isEffectiveIdentityRequired,
                isEffectiveIdentityRolesRequired: dataset.isEffectiveIdentityRolesRequired,
                isOnPremGatewayRequired: dataset.isOnPremGatewayRequired,
                targetStorageMode: dataset.targetStorageMode,
                createdDate: dataset.createdDate,
                contentProviderType: dataset.contentProviderType,
                addRowsAPIEnabled: dataset.addRowsAPIEnabled,
                tables: dataset.tables?.length || 0,
                relationships: dataset.relationships?.length || 0,
                datasources: dataset.datasources?.length || 0
            });

            return dataset;
        } catch (error: any) {
            console.error("Error fetching dataset details:", error.response?.data || error.message);
            throw new Error(`Failed to fetch dataset details: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Get datasources for a dataset to understand connectivity
     */
    async getDatasetDatasources(userId: string, datasetId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);

        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}/datasources`
                : `${PowerBIService.API_BASE_URL}/datasets/${datasetId}/datasources`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("🔌 Dataset Datasources:", response.data.value);
            return response.data.value;
        } catch (error: any) {
            console.error("Error fetching datasources:", error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Check dataset refresh history
     */
    async getDatasetRefreshHistory(userId: string, datasetId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);

        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}/refreshes?$top=1`
                : `${PowerBIService.API_BASE_URL}/datasets/${datasetId}/refreshes?$top=1`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const lastRefresh = response.data.value[0];

            if (lastRefresh) {
                console.log("🔄 Last Refresh:", {
                    status: lastRefresh.status,
                    startTime: lastRefresh.startTime,
                    endTime: lastRefresh.endTime,
                    refreshType: lastRefresh.refreshType
                });
            } else {
                console.log("⚠️ No refresh history found - dataset may never have been refreshed");
            }

            return response.data.value;
        } catch (error: any) {
            console.error("Error fetching refresh history:", error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Executes a DAX query against a dataset.
     * 
     */

    async getDatasetTables(userId: string, datasetId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);

        // First, get dataset details to understand what we're working with
        let datasetInfo;
        try {
            datasetInfo = await this.getDatasetDetails(userId, datasetId, workspaceId);
            // Check if dataset has tables in metadata
            console.log("Dataset Info:m e3rf", userId, datasetId, workspaceId);
            if (datasetInfo.tables && datasetInfo.tables.length > 0) {
                console.log("✅ Found tables in dataset metadata (no query needed)");
                return datasetInfo.tables.map((table: any) => ({
                    name: table.name,
                    columns: table.columns?.map((c: any) => ({
                        name: c.name,
                        dataType: c.dataType
                    }))
                }));
            }
        } catch (detailsError) {
            console.log("⚠️ Could not fetch dataset details, proceeding with query methods...");
        }

        // If no tables in metadata, try query methods
        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}/tables`
                : `${PowerBIService.API_BASE_URL}/datasets/${datasetId}/tables`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data.value;
        } catch (error: any) {
            console.log(`⚠️ Push API endpoint failed (Status: ${error.response?.status}, Msg: ${error.response?.data?.error?.message || error.message}). Falling back to DAX...`);

            // FALLBACK: Try DAX query to discover tables
            try {
                const daxResult = await this.executeDAX(userId, datasetId, "EVALUATE INFO.TABLES()", workspaceId);

                if (daxResult.results?.[0]?.tables?.[0]?.rows) {
                    const rows = daxResult.results[0].tables[0].rows;
                    return rows.map((row: any) => ({
                        name: row["[Name]"] || row["Name"]
                    })).filter((t: any) => !t.name.startsWith("DateTableTemplate"));
                }
            } catch (daxError: any) {
                console.log("⚠️ DAX INFO.TABLES() failed. Trying DMV fallback...");

                try {
                    // FALLBACK 2: Try DMV query
                    const dmvResult = await this.executeDAX(userId, datasetId, "SELECT * FROM $SYSTEM.TMSCHEMA_TABLES", workspaceId);

                    if (dmvResult.results?.[0]?.tables?.[0]?.rows) {
                        const rows = dmvResult.results[0].tables[0].rows;
                        console.log("✅ DMV fallback successful!");
                        return rows.map((row: any) => ({
                            name: row["Name"]
                        })).filter((t: any) => !t.name.startsWith("DateTableTemplate"));
                    }
                } catch (dmvError) {
                    console.log("⚠️ DMV fallback also failed.");
                }

                // FALLBACK 3: Smart Guess Strategy
                // If we can't ask for the menu, we'll guess the most common dishes.
                // We'll try: "Table", "Table1", "Sheet1", and the dataset name itself (e.g. "Q2_sales").
                const candidateNames = ["Table", "Table1", "Sheet1", "Data", datasetInfo?.name || ""];

                // Remove duplicates and empty strings
                const uniqueCandidates = [...new Set(candidateNames)].filter(n => n);

                console.log(`⚠️ Starting Smart Guess with candidates: ${uniqueCandidates.join(", ")}`);

                for (const tableName of uniqueCandidates) {
                    try {
                        // Sanitize table name for DAX (wrap in quotes if needed, though usually single quotes work)
                        // Simple sanitization: just use the name as is in single quotes
                        await this.executeDAX(userId, datasetId, `EVALUATE TOPN(1, '${tableName}')`, workspaceId);
                        console.log(`✅ Smart Guess successful! Found table: '${tableName}'`);
                        return [{ name: tableName }];
                    } catch (guessError) {
                        // Continue to next guess
                    }
                }
                console.log("⚠️ Smart Guess failed for all candidates.");

                console.log("⚠️ All table discovery methods failed. Diagnosing cause...");

                // If DAX also fails, use the detailed diagnostics

                // Try DAX if dataset info suggests it's queryable
                if (datasetInfo?.isRefreshable === false && datasetInfo?.isOnPremGatewayRequired) {
                    throw new Error(
                        "This dataset uses DirectQuery/Live Connection and the data source appears to be unavailable. " +
                        "Please check the gateway connection and data source status in Power BI."
                    );
                }

                // Check refresh status
                try {
                    const refreshHistory = await this.getDatasetRefreshHistory(userId, datasetId, workspaceId);

                    // AUTO-FIX: If never refreshed, try to trigger a refresh
                    if (!refreshHistory || refreshHistory.length === 0) {
                        console.log("🔄 Dataset has never been refreshed. Attempting to trigger auto-refresh...");
                        try {
                            await this.refreshDataset(userId, datasetId, workspaceId);
                            throw new Error(
                                "This dataset was not ready. We have triggered a refresh. " +
                                "Please wait 30-60 seconds and try again."
                            );
                        } catch (refreshError: any) {
                            // If it's our "Please wait" error, propagate it
                            if (refreshError.message.includes("Please wait")) {
                                throw refreshError;
                            }

                            console.error("❌ Auto-refresh failed:", refreshError.message);
                            // If auto-refresh fails (e.g. permission denied), throw the original error
                            throw new Error(
                                "This dataset has never been refreshed and we could not trigger it automatically. " +
                                "Please refresh the dataset in Power BI manually and try again."
                            );
                        }
                    }

                    const lastRefresh = refreshHistory[0];
                    if (lastRefresh.status === "Failed") {
                        throw new Error(
                            `The last dataset refresh failed. Please fix the refresh issue in Power BI. ` +
                            `Last attempted: ${lastRefresh.endTime}`
                        );
                    }
                } catch (refreshCheckError: any) {
                    // Propagate our specific "wait" error
                    if (refreshCheckError.message.includes("Please wait")) {
                        throw refreshCheckError;
                    }
                    console.log("⚠️ Could not check refresh status");
                }

                // Check for specific DAX error details (like empty dataset)
                const errorData = daxError.response?.data;
                if (errorData) {
                    const details = errorData.error?.["pbi.error"]?.details;
                    if (Array.isArray(details)) {
                        const noTablesError = details.find((d: any) =>
                            d.detail?.value?.includes("DAX Evaluate queries work only on databases which have at least one table") ||
                            d.detail?.value?.includes("Failed to execute the DAX query")
                        );
                        if (noTablesError) {
                            console.log("⚠️ Dataset has no tables or is not queryable. Returning diagnostic info.");
                            // Return diagnostic info instead of empty array
                            return [{
                                isDiagnostic: true,
                                reason: "EmptyOrDirectQuery",
                                storageMode: datasetInfo?.targetStorageMode || "Unknown",
                                message: "No tables found. This dataset might be empty or using DirectQuery."
                            }];
                        }
                    }
                }

                throw new Error(
                    `Unable to access tables from this dataset. Possible reasons:\n` +
                    `1. Dataset is using DirectQuery/Live Connection with an unavailable data source\n` +
                    `2. Dataset has never been refreshed or last refresh failed\n` +
                    `3. Dataset is empty or in an error state\n` +
                    `4. Insufficient permissions to query the dataset\n\n` +
                    `Please check the dataset status in Power BI and try again.`
                );
            }

            // If we get here, DAX succeeded but returned no rows/unexpected format, or some other edge case.
            // But usually we return from inside the try block.
            return [];
        }
    }

    /**
     * Triggers a dataset refresh.
     */
    async refreshDataset(userId: string, datasetId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);

        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}/refreshes`
                : `${PowerBIService.API_BASE_URL}/datasets/${datasetId}/refreshes`;

            await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("✅ Dataset refresh triggered successfully");
        } catch (error: any) {
            console.error("Error triggering dataset refresh:", error.response?.data || error.message);
            throw new Error(`Failed to refresh dataset: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async executeDAX(userId: string, datasetId: string, query: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);

        try {
            const url = workspaceId
                ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}/executeQueries`
                : `${PowerBIService.API_BASE_URL}/datasets/${datasetId}/executeQueries`;

            const response = await axios.post(url, {
                queries: [{ query }],
                serializerSettings: { includeNulls: true }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            return response.data;
        } catch (error: any) {
            console.error("Error executing DAX query:", JSON.stringify(error.response?.data || error.message, null, 2));
            const newError: any = new Error(`Failed to execute DAX query: ${error.response?.data?.error?.message || error.message}`);
            newError.response = error.response; // Attach response so callers can inspect it
            throw newError;
        }
    }

    async listReports(userId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);
        const url = workspaceId
            ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/reports`
            : `${PowerBIService.API_BASE_URL}/reports`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data.value;
    }

    async getReportConfig(userId: string, reportId: string, workspaceId?: string) {
        const token = await this.getAccessToken(userId);
        const url = workspaceId
            ? `${PowerBIService.API_BASE_URL}/groups/${workspaceId}/reports/${reportId}`
            : `${PowerBIService.API_BASE_URL}/reports/${reportId}`;

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const report = response.data;

        return {
            type: 'report',
            id: report.id,
            embedUrl: report.embedUrl,
            accessToken: token, // For "User Owns Data", we use the user's access token
            tokenType: 1, // Aad (Azure Active Directory) = 1
            settings: {
                panes: {
                    filters: {
                        visible: false
                    },
                    pageNavigation: {
                        visible: false
                    }
                }
            }
        };
    }

    async getDataForLLM(userId: string, datasetId: string, tableName: string, workspaceId?: string, format: 'csv' | 'markdown' = 'csv') {
        const query = `EVALUATE '${tableName}'`;
        const result = await this.executeDAX(userId, datasetId, query, workspaceId);

        if (format === 'csv') {
            return PowerBIDataTransformer.toCSV(result);
        } else {
            return PowerBIDataTransformer.toMarkdown(result);
        }
    }
}

export const powerBIService = new PowerBIService();
