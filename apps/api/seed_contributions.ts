import 'dotenv/config';
import { db } from "./db";
import { contributions } from "@shared/schema";

async function seed() {
    console.log("Seeding test contributions...");

    const testContributions = [
        {
            donorName: "Sophie et Marc Dubois",
            amount: 5000, // 50 EUR
            currency: "eur",
            message: "Félicitations pour votre mariage ! Que votre amour grandisse chaque jour. 💕",
            status: "completed",
            completedAt: new Date("2026-01-15T10:30:00Z")
        },
        {
            donorName: "Famille Martin",
            amount: 10000, // 100 EUR
            currency: "eur",
            message: "Tous nos vœux de bonheur pour cette belle union ! 🎉",
            status: "completed",
            completedAt: new Date("2026-01-18T14:20:00Z")
        },
        {
            donorName: "Claire et Thomas",
            amount: 7500, // 75 EUR
            currency: "eur",
            message: "Profitez bien de votre lune de miel ! 🌙✨",
            status: "completed",
            completedAt: new Date("2026-01-20T09:15:00Z")
        },
        {
            donorName: "Les Collègues de Bureau",
            amount: 15000, // 150 EUR
            currency: "eur",
            message: "De la part de toute l'équipe ! Longue vie aux mariés ! 🥂",
            status: "completed",
            completedAt: new Date("2026-01-22T16:45:00Z")
        },
        {
            donorName: "Mamie Jeanne",
            amount: 20000, // 200 EUR
            currency: "eur",
            message: "Pour mes petits chéris. Soyez heureux ensemble ! ❤️",
            status: "completed",
            completedAt: new Date("2026-01-25T11:00:00Z")
        },
        {
            donorName: "Antoine et Léa",
            amount: 3000, // 30 EUR
            currency: "eur",
            message: "Félicitations ! On vous souhaite le meilleur 🎊",
            status: "completed",
            completedAt: new Date("2026-01-28T13:30:00Z")
        },
        {
            donorName: "Les Cousins",
            amount: 12500, // 125 EUR
            currency: "eur",
            message: "Pour contribuer à votre voyage de noces ! Bon voyage ! ✈️🏝️",
            status: "completed",
            completedAt: new Date("2026-02-01T10:00:00Z")
        },
        {
            donorName: "Pierre et Marie Lefebvre",
            amount: 8000, // 80 EUR
            currency: "eur",
            message: "Que cette journée soit inoubliable ! 💐",
            status: "completed",
            completedAt: new Date("2026-02-03T15:20:00Z")
        },
        {
            donorName: "Anonyme",
            amount: 5000, // 50 EUR
            currency: "eur",
            message: null,
            status: "completed",
            completedAt: new Date("2026-02-04T08:45:00Z")
        },
        {
            donorName: "Les Amis du Lycée",
            amount: 6000, // 60 EUR
            currency: "eur",
            message: "Après toutes ces années, on est si heureux pour vous ! 🎓💑",
            status: "completed",
            completedAt: new Date("2026-02-04T12:10:00Z")
        }
    ];

    try {
        for (const contribution of testContributions) {
            await db.insert(contributions).values(contribution as any);
        }
        console.log(`Successfully seeded ${testContributions.length} test contributions`);
        console.log(`Total amount: ${testContributions.reduce((sum, c) => sum + c.amount, 0) / 100} EUR`);
        process.exit(0);
    } catch (error) {
        console.error("Error seeding contributions:", error);
        process.exit(1);
    }
}

seed();
