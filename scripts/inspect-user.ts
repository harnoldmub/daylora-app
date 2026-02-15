
import "dotenv/config";
import { storage } from "../apps/api/storage";

async function inspectUser() {
    const email = "test@libala.dev";
    console.log(`🔍 Inspecting user: ${email}`);

    try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
            console.log("❌ User not found in database.");
            process.exit(0);
        }

        console.log(`✅ User Found:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email || user.username}`);

        console.log(`\n🔍 Checking Weddings for Owner ID: ${user.id}`);
        const weddings = await storage.getWeddingsByOwner(user.id);

        if (weddings.length === 0) {
            console.log("⚠️ No weddings found for this user.");
        } else {
            console.log(`✅ Found ${weddings.length} wedding(s):`);
            weddings.forEach(w => {
                console.log(`   - [${w.id}] "${w.title}" (Slug: ${w.slug})`);
                console.log(`     Published: ${w.isPublished}`);
                console.log(`     Plan: ${w.currentPlan}`);
            });
        }

        process.exit(0);
    } catch (e) {
        console.error("Error inspecting DB:", e);
        process.exit(1);
    }
}

inspectUser();
