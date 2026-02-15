
import fetch from 'node-fetch';

async function verifyBackoffice() {
    const email = "test@libala.dev";
    const password = "Test1234";
    const baseUrl = "http://localhost:3000";

    console.log("🔍 1. Testing Server Connectivity...");
    try {
        const res = await fetch(baseUrl);
        console.log(`✅ [OK] Server is running at ${baseUrl} (Status: ${res.status})`);
    } catch (e) {
        console.error("❌ [FAIL] Cannot connect to server. Ensure 'npm run dev' is running.");
        console.error(e);
        process.exit(1);
    }

    console.log(`\n🔍 2. Testing Login for ${email}...`);
    try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const user = await res.json();
            console.log(`✅ [OK] Login successful!`);
            console.log(`   - User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

            // Note: We cannot easily check the dashboard redirection without cookie management in this simple script,
            // but a successful API login confirms the credentials work and the DB is responsive.
            console.log(`✅ [OK] Ready for manual browser testing.`);
        } else {
            console.error(`❌ [FAIL] Login failed. HTTP ${res.status}`);
            console.error(`   - Response: ${await res.text()}`);
            console.log(`   --> Hint: Check if the user exists in the database.`);
        }
    } catch (e) {
        console.error("❌ [FAIL] Error during login request:", e);
    }
}

verifyBackoffice();
