import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, buildWeddingConfig, resetCounter } from "../helpers/factories";

describe("Preview & Inline Editing", () => {
  let storage: MockStorage;
  let owner: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser());
    wedding = await storage.createWedding(buildWedding(owner.id, { slug: "preview-test" }));
  });

  describe("Public site access /:slug", () => {
    it("CASE: wedding is accessible by slug", async () => {
      const found = await storage.getWeddingBySlug("preview-test");
      expect(found).toBeDefined();
      expect(found!.slug).toBe("preview-test");
    });

    it("CASE: published wedding is accessible", async () => {
      await storage.updateWedding(wedding.id, { status: "published" });
      const found = await storage.getWeddingBySlug("preview-test");
      expect(found!.status).toBe("published");
    });

    it("CASE: draft wedding still has slug", async () => {
      const found = await storage.getWeddingBySlug("preview-test");
      expect(found!.status).toBe("draft");
    });
  });

  describe("Preview mode /preview/:slug", () => {
    it("CASE: preview wedding is resolved by slug", async () => {
      const found = await storage.getWeddingBySlug("preview-test");
      expect(found).toBeDefined();
    });
  });

  describe("Inline text editing", () => {
    it("CASE: updates heroTitle via config patch", async () => {
      const newConfig = {
        ...wedding.config,
        texts: { ...wedding.config.texts, heroTitle: "Léa & Thomas" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.texts.heroTitle).toBe("Léa & Thomas");
    });

    it("CASE: updates heroSubtitle", async () => {
      const newConfig = {
        ...wedding.config,
        texts: { ...wedding.config.texts, heroSubtitle: "Se marient enfin !" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.texts.heroSubtitle).toBe("Se marient enfin !");
    });

    it("CASE: updates rsvpTitle", async () => {
      const newConfig = {
        ...wedding.config,
        texts: { ...wedding.config.texts, rsvpTitle: "RÉPONDEZ SVP" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.texts.rsvpTitle).toBe("RÉPONDEZ SVP");
    });

    it("CASE: updates all text fields atomically", async () => {
      const newTexts = {
        ...wedding.config.texts,
        heroTitle: "New Hero",
        heroSubtitle: "New Sub",
        storyTitle: "New Story",
        cagnotteTitle: "New Cagnotte",
      };
      const newConfig = { ...wedding.config, texts: newTexts };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });

      expect(updated.config.texts.heroTitle).toBe("New Hero");
      expect(updated.config.texts.heroSubtitle).toBe("New Sub");
      expect(updated.config.texts.storyTitle).toBe("New Story");
      expect(updated.config.texts.cagnotteTitle).toBe("New Cagnotte");
    });

    it("EDGE: empty string is valid for text fields", async () => {
      const newConfig = {
        ...wedding.config,
        texts: { ...wedding.config.texts, heroTitle: "" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.texts.heroTitle).toBe("");
    });

    it("EDGE: unicode and emojis in text fields", async () => {
      const newConfig = {
        ...wedding.config,
        texts: { ...wedding.config.texts, heroTitle: "Léa 💍 Thomas — Été 2026" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.texts.heroTitle).toBe("Léa 💍 Thomas — Été 2026");
    });
  });

  describe("Media editing", () => {
    it("CASE: updates hero image", async () => {
      const newConfig = {
        ...wedding.config,
        media: { ...wedding.config.media, heroImage: "data:image/jpeg;base64,/9j/test" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.media.heroImage).toContain("data:image/jpeg");
    });

    it("CASE: updates couple photo", async () => {
      const newConfig = {
        ...wedding.config,
        media: { ...wedding.config.media, couplePhoto: "https://cdn.example.com/photo.jpg" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.media.couplePhoto).toBe("https://cdn.example.com/photo.jpg");
    });

    it("CASE: updates gallery images", async () => {
      const newImages = ["/img/1.jpg", "/img/2.jpg", "/img/3.jpg"];
      const newConfig = {
        ...wedding.config,
        sections: { ...wedding.config.sections, galleryImages: newImages },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.sections.galleryImages).toEqual(newImages);
    });
  });

  describe("Template switching", () => {
    it("CASE: switches template from classic to modern", async () => {
      expect(wedding.templateId).toBe("classic");
      const updated = await storage.updateWedding(wedding.id, { templateId: "modern" });
      expect(updated.templateId).toBe("modern");
    });

    it("CASE: config preserved after template switch", async () => {
      const configBefore = wedding.config.texts.heroTitle;
      await storage.updateWedding(wedding.id, { templateId: "minimal" });
      const after = await storage.getWedding(wedding.id);
      expect(after!.config.texts.heroTitle).toBe(configBefore);
    });

    it("CASE: switches between all templates", async () => {
      for (const template of ["classic", "modern", "minimal"]) {
        await storage.updateWedding(wedding.id, { templateId: template });
        const w = await storage.getWedding(wedding.id);
        expect(w!.templateId).toBe(template);
      }
    });
  });

  describe("Theme customization", () => {
    it("CASE: updates primary color", async () => {
      const newConfig = {
        ...wedding.config,
        theme: { ...wedding.config.theme, primaryColor: "#FF6B6B" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.theme.primaryColor).toBe("#FF6B6B");
    });

    it("CASE: updates button style", async () => {
      const newConfig = {
        ...wedding.config,
        theme: { ...wedding.config.theme, buttonStyle: "outline" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.theme.buttonStyle).toBe("outline");
    });

    it("CASE: updates font family", async () => {
      const newConfig = {
        ...wedding.config,
        theme: { ...wedding.config.theme, fontFamily: "sans" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.theme.fontFamily).toBe("sans");
    });
  });

  describe("Navigation / Section configuration", () => {
    it("CASE: toggles RSVP page off", async () => {
      const newConfig = {
        ...wedding.config,
        navigation: {
          ...wedding.config.navigation,
          pages: { ...wedding.config.navigation.pages, rsvp: false },
        },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.navigation.pages.rsvp).toBe(false);
    });

    it("CASE: adds custom menu item", async () => {
      const newMenuItem = {
        id: "custom-1",
        label: "Notre Playlist",
        path: "/playlist",
        enabled: true,
        linkType: "external" as const,
        externalUrl: "https://open.spotify.com/playlist/123",
      };
      const newConfig = {
        ...wedding.config,
        navigation: {
          ...wedding.config.navigation,
          menuItems: [...wedding.config.navigation.menuItems, newMenuItem],
        },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.navigation.menuItems).toHaveLength(1);
      expect(updated.config.navigation.menuItems[0].label).toBe("Notre Playlist");
    });

    it("CASE: toggles features on/off", async () => {
      const newConfig = {
        ...wedding.config,
        features: {
          ...wedding.config.features,
          giftsEnabled: false,
          cagnotteEnabled: false,
        },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.features.giftsEnabled).toBe(false);
      expect(updated.config.features.cagnotteEnabled).toBe(false);
      expect(updated.config.features.jokesEnabled).toBe(true);
    });
  });
});
