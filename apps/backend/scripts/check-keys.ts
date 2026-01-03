
import { db } from '../src/auth/auth';
import { apiKeys } from '../src/auth/schema/schema';

async function main() {
    const keys = await db.select().from(apiKeys);
    console.log("Existing API Keys:");
    keys.forEach(k => console.log(k.key));
    process.exit(0);
}

main().catch(console.error);
