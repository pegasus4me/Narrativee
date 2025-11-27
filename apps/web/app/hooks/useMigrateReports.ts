import { useEffect, useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { reportApi } from '../../lib/apis';

interface LocalReport {
  id: string;
  success: boolean;
  template: {
    id: string;
    name: string;
    markdown: string;
  };
  metadata: {
    fileName: string;
    rowCount: number;
    columns: string[];
  };
}

/**
 * Hook to automatically migrate localStorage reports to database when user logs in
 */
export function useMigrateReports() {
  const { data: session } = authClient.useSession();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);

  useEffect(() => {
    // Only run if user is authenticated and not already migrating
    if (!session?.user || isMigrating) return;

    const migrateLocalReports = async () => {
      setIsMigrating(true);
      let count = 0;

      try {
        console.log('🔄 Starting report migration...');

        // Get all localStorage keys
        const localStorageKeys = Object.keys(localStorage);

        // Find all report keys (format: "report-{id}")
        const reportKeys = localStorageKeys.filter(key => key.startsWith('report-') && key !== 'report-content');

        console.log(`📦 Found ${reportKeys.length} local reports to migrate`);

        for (const key of reportKeys) {
          try {
            const reportData: LocalReport = JSON.parse(localStorage.getItem(key) || '{}');

            // Skip if invalid data
            if (!reportData.success || !reportData.template || !reportData.metadata) {
              console.warn(`⚠️ Skipping invalid report: ${key}`);
              continue;
            }

            // Check if this report is already a UUID (already in database)
            const reportId = key.replace('report-', '');
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(reportId)) {
              console.log(`✅ Report ${reportId} already in database, skipping`);
              continue;
            }

            console.log(`📤 Migrating report: ${reportData.metadata.fileName}`);

            // Call backend to save this report
            // We'll use the generate endpoint but with pre-generated content
            // Or create a dedicated migrate endpoint
            const migratedReport = await reportApi.migrateLocalReport({
              name: reportData.template.name,
              fileName: reportData.metadata.fileName,
              markdownContent: reportData.template.markdown,
              metadata: reportData.metadata,
            });

            console.log(`✅ Migrated: ${key} → ${migratedReport.id}`);

            // Remove from localStorage after successful migration
            localStorage.removeItem(key);
            localStorage.removeItem(`report-content-${reportId}`);

            count++;
          } catch (error) {
            console.error(`❌ Failed to migrate report ${key}:`, error);
            // Continue with next report even if one fails
          }
        }

        setMigratedCount(count);
        console.log(`✅ Migration complete! Migrated ${count} reports`);
      } catch (error) {
        console.error('❌ Migration failed:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    // Run migration
    migrateLocalReports();
  }, [session?.user]); // Only run when user logs in

  return { isMigrating, migratedCount };
}
