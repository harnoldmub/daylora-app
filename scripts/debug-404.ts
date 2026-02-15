
import "dotenv/config";
import fetch from 'node-fetch';

async function testWeddingFetch() {
    const slug = "marie-et-sophie";
    const email = "test@libala.dev";
    const password = "Test1234";
    const baseUrl = "http://localhost:3000";

    // 1. Login to get cookie
    console.log("LOGIN Request...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const cookies = loginRes.headers.get('set-cookie');
    console.log("Login Status:", loginRes.status);
    console.log("Set-Cookie:", cookies ? "PRESENT" : "MISSING");

    // 2. Fetch Wedding with Cookie
    console.log("\nFETCH Wedding Request...");
    const headers: any = {
        'x-wedding-slug': slug,
        'Cookie': cookies // Pass the cookie manually
    };

    const res = await fetch(`${baseUrl}/api/weddings`, { headers });
    console.log(`GET /api/weddings status: ${res.status}`);

    if (res.status !== 200) {
        console.log("Response Body:", await res.text());
    } else {
        const data = await res.json();
        console.log("Success! Received wedding data.");
        // console.log(data);
    }
}

testWeddingFetch();
