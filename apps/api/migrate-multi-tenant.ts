import 'dotenv/config';
import { db } from './db';
import { weddings, users, rsvpResponses, contributions } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';

async function migrate() {
    console.log('🔄 Starting multi-tenant migration...');

    try {
        // 1. Get or create a default owner
        let [owner] = await db.select().from(users).limit(1);
        if (!owner) {
            console.log('👤 No users found, creating a default owner...');
            [owner] = await db.insert(users).values({
                id: 'system-default',
                email: 'admin@libala.io',
                firstName: 'System',
                lastName: 'Admin',
            }).returning();
        }
        console.log(`👤 Using owner: ${owner.firstName} (${owner.id})`);

        // 2. Create a default wedding
        console.log('💍 Creating default wedding...');
        const [defaultWedding] = await db.insert(weddings).values([{
            ownerId: owner.id,
            slug: 'default-wedding',
            title: 'Mon Premier Mariage',
            currentPlan: 'free',
            config: {
                theme: {
                    primaryColor: '#D4AF37',
                    secondaryColor: '#FFFFFF',
                    fontFamily: 'serif',
                    toneId: 'golden-ivory',
                    buttonStyle: 'solid',
                    buttonRadius: 'pill'
                },
                seo: { title: 'Mon Premier Mariage', description: 'Rejoignez-nous' },
                features: { jokesEnabled: true, giftsEnabled: true, cagnotteEnabled: true, liveEnabled: true },
                texts: {
                    siteTitle: "",
                    heroTitle: "Mon Premier Mariage",
                    heroSubtitle: "Le Mariage de",
                    weddingDate: new Date().toISOString(),
                    heroCta: "Confirmer votre présence",
                    rsvpTitle: "CONFIRMEZ VOTRE PRÉSENCE",
                    rsvpDescription: "Nous serions ravis de vous compter parmi nous",
                    rsvpButton: "Je confirme ma présence",
                    navRsvp: "RSVP",
                    navCagnotte: "Cagnotte",
                    navLive: "Live",
                    locationTitle: "LIEU & ACCÈS",
                    locationDescription: "Toutes les informations pour nous rejoindre",
                    programTitle: "DÉROULEMENT",
                    programDescription: "Le programme de notre journée",
                    storyTitle: "NOTRE HISTOIRE",
                    storyBody: "",
                    cagnotteTitle: "CAGNOTTE MARIAGE",
                    cagnotteDescription: "Votre présence est notre plus beau cadeau. Si vous souhaitez contribuer à notre voyage de noces ou à notre nouveau départ, vous pouvez participer à notre cagnotte.",
                    cagnotteBackLabel: "Retour",
                    cagnotteSubmitLabel: "Contribuer",
                    liveTitle: "CAGNOTTE EN DIRECT",
                    liveSubtitle: "Merci pour votre générosité",
                    liveDonorsTitle: "NOS GÉNÉREUX DONATEURS",
                    liveQrCaption: "Scannez pour contribuer",
                    galleryTitle: "GALERIE",
                    galleryDescription: "Quelques instants capturés avant le grand jour.",
                },
                media: {
                    heroImage: "",
                    couplePhoto: ""
                },
                branding: {
                    logoUrl: "",
                    logoText: ""
                },
                sections: {
                    countdownDate: "",
                    cagnotteSuggestedAmounts: [20, 50, 100, 150, 200],
                    galleryImages: [
                        "/defaults/gallery/01.jpg",
                        "/defaults/gallery/02.jpg",
                        "/defaults/gallery/03.jpg",
                        "/defaults/gallery/04.jpg",
                        "/defaults/gallery/05.jpg",
                        "/defaults/gallery/06.jpg",
                    ],
                    locationItems: [
                        {
                            title: "Cérémonie civile",
                            address: "Mairie de Lille — 10 Rue Pierre Mauroy",
                            description: "Rendez-vous à 14h30 pour accueillir les invités."
                        },
                        {
                            title: "Réception",
                            address: "Château de la Verrière — Salle des Roses",
                            description: "Cocktail et dîner à partir de 18h."
                        }
                    ],
                    programItems: [
                        {
                            time: "14:30",
                            title: "Accueil des invités",
                            description: "Installation et photos de famille."
                        },
                        {
                            time: "15:00",
                            title: "Cérémonie",
                            description: "Échange des vœux et sortie des mariés."
                        },
                        {
                            time: "18:30",
                            title: "Cocktail & Dîner",
                            description: "Apéritif, repas et animations."
                        }
                    ]
                },
                navigation: {
                    pages: {
                        rsvp: true,
                        cagnotte: true,
                        live: true,
                        story: true,
                        gallery: true,
                        location: true,
                        program: true,
                    },
                    menuItems: [
                        { id: "rsvp", label: "RSVP", path: "rsvp", enabled: true },
                        { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true },
                        { id: "live", label: "Live", path: "live", enabled: true },
                    ],
                    customPages: [],
                }
            },
        }]).onConflictDoNothing().returning();

        const weddingId = defaultWedding?.id || (await db.select().from(weddings).where(eq(weddings.slug, 'default-wedding')))[0].id;
        console.log(`💍 Wedding ID: ${weddingId}`);

        // 3. Link existing RSVP responses
        console.log('📝 Linking RSVP responses...');
        const updatedRsvps = await db.update(rsvpResponses)
            .set({ weddingId })
            .where(isNull(rsvpResponses.weddingId))
            .returning();
        console.log(`✅ Updated ${updatedRsvps.length} RSVP responses.`);

        // 4. Link existing contributions
        console.log('💰 Linking contributions...');
        const updatedContributions = await db.update(contributions)
            .set({ weddingId })
            .where(isNull(contributions.weddingId))
            .returning();
        console.log(`✅ Updated ${updatedContributions.length} contributions.`);

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
