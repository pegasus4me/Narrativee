export class PowerBIDataTransformer {
    /**
     * Converts DAX query result to CSV format.
     */
    static toCSV(daxResult: any): string {
        if (!daxResult?.results?.[0]?.tables?.[0]?.rows) {
            return "";
        }

        const rows = daxResult.results[0].tables[0].rows;
        if (rows.length === 0) {
            return "";
        }

        // Extract headers from the first row
        const headers = Object.keys(rows[0]);
        const csvRows = [headers.join(",")];

        for (const row of rows) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return "";
                // Escape quotes and wrap in quotes if contains comma or newline
                const stringVal = String(val);
                if (stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            });
            csvRows.push(values.join(","));
        }

        return csvRows.join("\n");
    }

    /**
     * Converts DAX query result to Markdown table format.
     */
    static toMarkdown(daxResult: any): string {
        if (!daxResult?.results?.[0]?.tables?.[0]?.rows) {
            return "";
        }

        const rows = daxResult.results[0].tables[0].rows;
        if (rows.length === 0) {
            return "";
        }

        const headers = Object.keys(rows[0]);
        const headerRow = `| ${headers.join(" | ")} |`;
        const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

        const markdownRows = [headerRow, separatorRow];

        for (const row of rows) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return "";
                return String(val).replace(/\|/g, "\\|"); // Escape pipes
            });
            markdownRows.push(`| ${values.join(" | ")} |`);
        }

        return markdownRows.join("\n");
    }
}
