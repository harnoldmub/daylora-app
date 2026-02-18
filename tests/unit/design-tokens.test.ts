import { describe, it, expect } from "vitest";
import {
  colors,
  typography,
  spacing,
  radius,
  templateTokens,
  getTokens,
  type TemplateId,
  type TemplateTokens,
} from "../../apps/app/client/src/design-system/tokens";

describe("design system tokens", () => {
  describe("colors", () => {
    it("exposes all required color tokens", () => {
      expect(colors).toHaveProperty("primary");
      expect(colors).toHaveProperty("background");
      expect(colors).toHaveProperty("accent");
      expect(colors).toHaveProperty("secondary");
      expect(colors).toHaveProperty("white");
      expect(colors).toHaveProperty("black");
      expect(colors).toHaveProperty("muted");
      expect(colors).toHaveProperty("border");
    });

    it("uses valid hex color format", () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.values(colors).forEach((color) => {
        expect(color).toMatch(hexRegex);
      });
    });
  });

  describe("typography", () => {
    it("has serif, sans, and mono families", () => {
      expect(typography.serif).toContain("Playfair Display");
      expect(typography.sans).toContain("Manrope");
      expect(typography.mono).toContain("JetBrains Mono");
    });

    it("includes fallback fonts", () => {
      expect(typography.serif).toContain("Georgia");
      expect(typography.sans).toContain("system-ui");
    });
  });

  describe("spacing", () => {
    it("has section spacing variants", () => {
      expect(spacing.section).toHaveProperty("sm");
      expect(spacing.section).toHaveProperty("md");
      expect(spacing.section).toHaveProperty("lg");
      expect(spacing.section).toHaveProperty("xl");
    });

    it("has container width variants", () => {
      expect(spacing.container).toHaveProperty("sm");
      expect(spacing.container).toHaveProperty("md");
      expect(spacing.container).toHaveProperty("lg");
      expect(spacing.container).toHaveProperty("xl");
      expect(spacing.container).toHaveProperty("full");
    });

    it("section values include padding", () => {
      Object.values(spacing.section).forEach((val) => {
        expect(val).toContain("py-");
        expect(val).toContain("px-");
      });
    });
  });

  describe("radius", () => {
    it("has progressive radius values", () => {
      const keys = Object.keys(radius);
      expect(keys).toEqual(
        expect.arrayContaining(["none", "sm", "md", "lg", "xl", "xxl", "full"])
      );
    });
  });
});

describe("template tokens", () => {
  const templateIds: TemplateId[] = ["classic", "modern", "minimal"];

  it("defines all 3 templates", () => {
    expect(Object.keys(templateTokens)).toEqual(
      expect.arrayContaining(templateIds)
    );
  });

  templateIds.forEach((templateId) => {
    describe(`template: ${templateId}`, () => {
      let tokens: TemplateTokens;

      beforeAll(() => {
        tokens = templateTokens[templateId];
      });

      it("has correct id", () => {
        expect(tokens.id).toBe(templateId);
      });

      it("has a display name", () => {
        expect(tokens.name).toBeTruthy();
        expect(typeof tokens.name).toBe("string");
      });

      it("uses serif or sans font", () => {
        expect(["serif", "sans"]).toContain(tokens.font);
      });

      it("has hero section tokens", () => {
        expect(tokens.hero).toBeDefined();
        expect(tokens.hero.title).toBeTruthy();
        expect(tokens.hero.subtitle).toBeTruthy();
        expect(tokens.hero.button).toBeTruthy();
        expect(["center", "left"]).toContain(tokens.hero.alignment);
        expect(["none", "serif-border", "floral"]).toContain(tokens.hero.decoration);
      });

      it("has RSVP section tokens", () => {
        expect(tokens.rsvp).toBeDefined();
        expect(tokens.rsvp).toHaveProperty("section");
        expect(tokens.rsvp).toHaveProperty("card");
      });

      it("has story section tokens", () => {
        expect(tokens.story).toBeDefined();
        expect(tokens.story).toHaveProperty("title");
        expect(tokens.story).toHaveProperty("layout");
        expect(tokens.story).toHaveProperty("image");
      });

      it("has gallery section tokens", () => {
        expect(tokens.gallery).toBeDefined();
        expect(tokens.gallery).toHaveProperty("imageRadius");
      });

      it("has footer section tokens", () => {
        expect(tokens.footer).toBeDefined();
        expect(tokens.footer).toHaveProperty("section");
      });

      it("has all required sections", () => {
        const requiredSections = [
          "hero", "rsvp", "story", "gallery",
          "location", "schedule", "gifts", "cagnotte", "footer",
        ];
        requiredSections.forEach((section) => {
          expect(tokens).toHaveProperty(section);
        });
      });
    });
  });

  describe("classic template specifics", () => {
    it("uses serif font", () => {
      expect(templateTokens.classic.font).toBe("serif");
    });
    it("has center-aligned hero", () => {
      expect(templateTokens.classic.hero.alignment).toBe("center");
    });
    it("has serif-border decoration", () => {
      expect(templateTokens.classic.hero.decoration).toBe("serif-border");
    });
  });

  describe("modern template specifics", () => {
    it("uses sans font", () => {
      expect(templateTokens.modern.font).toBe("sans");
    });
    it("has left-aligned hero", () => {
      expect(templateTokens.modern.hero.alignment).toBe("left");
    });
    it("has no decoration", () => {
      expect(templateTokens.modern.hero.decoration).toBe("none");
    });
  });

  describe("minimal template specifics", () => {
    it("uses sans font", () => {
      expect(templateTokens.minimal.font).toBe("sans");
    });
    it("has floral decoration", () => {
      expect(templateTokens.minimal.hero.decoration).toBe("floral");
    });
  });
});

describe("getTokens()", () => {
  it("returns classic tokens by default", () => {
    const tokens = getTokens();
    expect(tokens.id).toBe("classic");
  });

  it("returns classic for undefined", () => {
    const tokens = getTokens(undefined);
    expect(tokens.id).toBe("classic");
  });

  it("returns classic for unknown templateId", () => {
    const tokens = getTokens("nonexistent");
    expect(tokens.id).toBe("classic");
  });

  it("returns correct tokens for each valid templateId", () => {
    expect(getTokens("classic").id).toBe("classic");
    expect(getTokens("modern").id).toBe("modern");
    expect(getTokens("minimal").id).toBe("minimal");
  });
});
