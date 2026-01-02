import { db } from "../auth/auth";
import { user, apiKeys, saasUsers, events } from "../auth/schema/schema";

async function main() {
    console.log("--- DIAGNOSTIC START ---");

    // 1. List All Users (Admins)
    const allUsers = await db.select().from(user);
    console.log(`\n1. SYSTEM USERS (${allUsers.length}):`);
    allUsers.forEach(u => console.log(`   - ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`));

    // 2. List All API Keys
    const allKeys = await db.select().from(apiKeys);
    console.log(`\n2. API KEYS (${allKeys.length}):`);
    allKeys.forEach(k => console.log(`   - Key: ${k.key}, OwnerID: ${k.userId}, ID: ${k.id}`));

    // 3. List All SaaS Users (The ones that should show on dashboard)
    const allSaasUsers = await db.select().from(saasUsers);
    console.log(`\n3. SAAS USERS (${allSaasUsers.length}):`);
    allSaasUsers.forEach(su => console.log(`   - ID: ${su.id}, ApiKeyID: ${su.apiKeyId}, LastSeen: ${su.lastSeenAt}`));

    // 4. List Recent Events
    const recentEvents = await db.select().from(events).limit(5);
    console.log(`\n4. RECENT EVENTS (${recentEvents.length}):`);
    recentEvents.forEach(e => console.log(`   - Event: ${e.eventName}, User: ${e.saasUserId}, ApiKeyID: ${e.apiKeyId}`));

    console.log("\n--- DIAGNOSTIC END ---");
    process.exit(0);
}

main().catch(console.error);
