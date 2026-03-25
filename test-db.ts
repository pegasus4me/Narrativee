import { NoteService } from "./apps/backend/src/services/note-service";
import { db } from "./apps/backend/src/auth/auth";

async function run() {
    // Just fetch any user id
    const res = await db.query.notes.findFirst({});
    if (!res) {
        console.log("No notes");
        process.exit(0);
    }
    const data = await NoteService.getPostingHeatmap(res.userId!);
    console.log(data);
    process.exit(0);
}

run().catch(console.error);
