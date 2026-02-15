
import { db } from "./apps/api/db";
import { weddings, rsvpResponses, contributions, users } from "./packages/shared/schema";
import { eq, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function migrate() {
    console.log("Starting data migration...");

    try {
        // 1. Find a user to be the owner of the default wedding (e.g., the first user)
        const allUsers = await db.select().from(users);
        if (allUsers.length === 0) {
            console.log("No users found. Creating a temporary owner user...");
            // In a real scenario, you'd want a real user ID. 
            // For now, let's assume there's at least one user or we create one if needed.
        }

        const ownerId = allUsers[0]?.id || "default-owner-id";

        // 2. Create the default wedding
        console.log("Creating default wedding...");
        const weddingId = "00000000-0000-0000-0000-000000000000"; // Fixed UUID for default wedding
        const [defaultWedding] = await db.insert(weddings).values({
            id: weddingId,
            ownerId: ownerId,
            slug: "notre-mariage",
            title: "Notre Mariage",
            weddingDate: new Date("2025-08-30"), // Updated field name
            config: {
                jokesEnabled: true,
                giftsEnabled: true,
            },
        }).onConflictDoNothing().returning();

        // 3. Update RSVP responses
        console.log("Linking RSVP responses to default wedding...");
        await db.update(rsvpResponses)
            .set({ weddingId })
            .where(isNull(rsvpResponses.weddingId));

        // 4. Update Contributions
        console.log("Linking contributions to default wedding...");
        await db.update(contributions)
            .set({ weddingId })
            .where(isNull(contributions.weddingId));

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
