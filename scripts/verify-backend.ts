
async function verifyBackend() {
    const email = "test@libala.dev";
    const password = "Test1234";
    const baseUrl = "http://localhost:3000";

    console.log("🔍 Checking Server Health...");
    try {
        const health = await fetch(baseUrl + "/");
        if (health.status !== 200) throw new Error(`Server returned ${health.status}`);
        console.log("✅ Server is reachable (Home Page)");
    } catch (e) {
        console.error("❌ Server is NOT reachable. Is it running?");
        process.exit(1);
    }

    console.log("\n🔑 Verifying Credentials for: " + email);
    try {
        // We'll perform a login request
        const response = await fetch(baseUrl + "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            console.log("✅ Login Successful! Status:", response.status);
            const user = await response.json();
            console.log("👤 User ID:", user.id);
            console.log("👤 User Name:", user.firstName, user.lastName);

            // Check for wedding
            /*
            // We can't easily check 'cookies' with simple fetch without a cookie jar, 
            // but getting the user object means auth worked.
            */
        } else {
            if (response.status === 401) {
                console.log("❌ Login Failed: Invalid Credentials (401)");
                console.log("   --> The user might not exist or password is wrong.");
            } else {
                console.log("❌ Login Failed with status:", response.status);
                console.log("   Response:", await response.text());
            }
        }
    } catch (e) {
        console.error("❌ Login Request Failed:", e);
    }
}

verifyBackend().catch((e) => {
    console.error("Verification script failed:", e);
    process.exit(1);
});
