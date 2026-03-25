import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres.meppdrozmzhihehmtuke:SSRN01020814@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to DB...");
  const res = await client.query(`
    SELECT "userId", TO_CHAR(DATE_TRUNC('day', "publishedAt"), 'YYYY-MM-DD') AS date, COUNT(id) AS count
    FROM notes
    WHERE "publishedAt" IS NOT NULL
    GROUP BY "userId", DATE_TRUNC('day', "publishedAt")
    ORDER BY DATE_TRUNC('day', "publishedAt") DESC
    LIMIT 20
  `);
  console.log("Raw DB Results:", res.rows);
  await client.end();
}

run().catch(console.error);
