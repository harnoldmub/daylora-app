
import 'dotenv/config';
import { db } from "./db";
import { rsvpResponses } from "@shared/schema";

async function seed() {
    console.log("Seeding WhatsApp RSVPs...");

    const phone = "+33698827193";

    const guests = [
        {
            firstName: "Test",
            lastName: "Whatsapp1",
            email: "test1@whatsapp.com",
            phone: phone,
            partySize: 1,
            availability: "both",
            status: "pending"
        },
        {
            firstName: "Test",
            lastName: "Whatsapp2",
            email: "test2@whatsapp.com",
            phone: phone,
            partySize: 2,
            availability: "both",
            status: "pending"
        },
        {
            firstName: "Test",
            lastName: "Whatsapp3",
            email: "test3@whatsapp.com",
            phone: phone,
            partySize: 1,
            availability: "21-march",
            status: "confirmed"
        }
    ];

    try {
        for (const guest of guests) {
            await db.insert(rsvpResponses).values(guest as any);
        }
        console.log("Successfully seeded 3 guests with phone +33698827193");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
}

seed();
