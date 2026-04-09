import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./utils";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { handleStripeWebhook } from "./stripeWebhook";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { weddings } from "@shared/schema";
import { eq } from "drizzle-orm";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectSeoHtml(
  html: string,
  options: {
    title: string;
    description: string;
    canonicalUrl: string;
    imageUrl: string;
    robots?: string;
    locale?: string;
    jsonLd?: Record<string, any>;
  }
): string {
  const robots = options.robots || "index,follow,max-image-preview:large";
  const locale = options.locale || "fr_FR";
  const jsonLd = JSON.stringify(options.jsonLd || {}).replace(/</g, "\\u003c");

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(options.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(options.description)}">`)
    .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${escapeHtml(robots)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeHtml(options.canonicalUrl)}">`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(options.title)}">`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(options.description)}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${escapeHtml(options.imageUrl)}">`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeHtml(options.canonicalUrl)}">`)
    .replace(/<meta property="og:locale"[^>]*>/, `<meta property="og:locale" content="${escapeHtml(locale)}">`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeHtml(options.title)}">`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escapeHtml(options.description)}">`)
    .replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${escapeHtml(options.imageUrl)}">`)
    .replace(/<script id="daylora-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="daylora-jsonld" type="application/ld+json">${jsonLd}</script>`);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://*.stripe.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://*.stripe.com", "https://appleid.cdn-apple.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "frame-src": ["'self'", "https://*.stripe.com", "https://appleid.apple.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://*.stripe.com", "https://accounts.google.com", "https://appleid.apple.com"],
    },
  },
}));

if (isProduction) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(__dirname, "public");
  app.use(express.static(publicDir, {
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      } else if (/\.(js|css)$/.test(filePath) && /\.[a-f0-9]{8,}\./.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }));
}

const allowedOrigins = new Set([
  process.env.APP_BASE_URL || "http://localhost:5174",
  process.env.MARKETING_BASE_URL || "http://localhost:5173",
]);

if (isProduction) {
  [
    "https://daylora.app",
    "https://www.daylora.app",
  ].forEach((origin) => allowedOrigins.add(origin));
}

if (!isProduction) {
  [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].forEach((origin) => allowedOrigins.add(origin));
}

if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}

if (process.env.REPLIT_DEPLOYMENT_URL) {
  allowedOrigins.add(`https://${process.env.REPLIT_DEPLOYMENT_URL}`);
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    if (origin && /\.replit\.(dev|app)$/.test(origin)) return cb(null, true);
    if (origin && /\.daylora\.app$/.test(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

const isDevMode = process.env.NODE_ENV !== "production";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDevMode ? 2000 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/live'),
});

app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDevMode ? 500 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    const { getStripeSync } = await import("./stripeClient");
    
    if (process.env.DATABASE_URL) {
      await runMigrations({ databaseUrl: process.env.DATABASE_URL, schema: "stripe" });
      log("Stripe schema ready");

      const stripeSync = await getStripeSync();
      let webhookBase = process.env.APP_BASE_URL;
      if (!webhookBase) {
        const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
        if (domain) webhookBase = `https://${domain}`;
      }
      if (webhookBase) {
        const targetUrl = `${webhookBase}/api/webhooks/stripe`;
        try {
          const result = await stripeSync.findOrCreateManagedWebhook(targetUrl);
          const webhookUrl = result?.webhook?.url || result?.url || targetUrl;
          log(`Stripe webhook configured: ${webhookUrl}`);
        } catch (webhookErr: any) {
          console.error("Stripe webhook setup error (non-fatal):", webhookErr.message);
        }
      }

      stripeSync.syncBackfill().then(() => log("Stripe data synced")).catch((e: any) => console.error("Stripe sync error:", e));
    }
  } catch (e: any) {
    console.error("Stripe init error (non-fatal):", e.message);
  }

  const server = await registerRoutes(app);
  const appUrl = process.env.APP_BASE_URL || "https://daylora.app";

  app.get("/robots.txt", async (_req, res) => {
    res.type("text/plain");
    return res.send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /api",
        "Disallow: /preview",
        "Disallow: /login",
        "Disallow: /signup",
        "Disallow: /dashboard",
        "",
        `Sitemap: ${appUrl}/sitemap.xml`,
      ].join("\n")
    );
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const publishedWeddings = await db
      .select({ slug: weddings.slug, updatedAt: weddings.updatedAt })
      .from(weddings)
      .where(eq(weddings.isPublished, true));

    const staticUrls = [
      { loc: `${appUrl}/`, changefreq: "weekly", priority: "1.0" },
      { loc: `${appUrl}/onboarding`, changefreq: "monthly", priority: "0.8" },
    ];

    const dynamicUrls = publishedWeddings.map((wedding) => ({
      loc: `${appUrl}/${wedding.slug}`,
      changefreq: "weekly",
      priority: "0.7",
      lastmod: wedding.updatedAt ? new Date(wedding.updatedAt).toISOString() : undefined,
    }));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls]
  .map(
    (entry) => `<url>
  <loc>${escapeHtml(entry.loc)}</loc>
  ${"lastmod" in entry && entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
  <changefreq>${entry.changefreq}</changefreq>
  <priority>${entry.priority}</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

    res.type("application/xml");
    return res.send(xml);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("API error:", err);
  });

  if (isProduction) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const publicDir = path.resolve(__dirname, "public");
    const fs = await import("fs");
    const indexHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");
    const { storage } = await import("./storage");
    const appUrl = process.env.APP_BASE_URL || "https://daylora.app";

    const knownPrefixes = new Set([
      "login", "signup", "dashboard", "onboarding", "onboarding-preview",
      "verify-email", "forgot-password", "reset-password", "contribution",
      "invitation", "checkin", "preview", "admin", "api", "assets", "src",
    ]);

    app.get("*", async (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

      const segments = req.path.split("/").filter(Boolean);
      const firstSegment = segments[0] || "";

      if (!firstSegment) {
        return res.send(indexHtml);
      }

      if (["preview", "admin", "login", "signup", "dashboard", "onboarding-preview"].includes(firstSegment)) {
        const noIndexHtml = injectSeoHtml(indexHtml, {
          title: "Daylora",
          description: "Daylora",
          canonicalUrl: `${appUrl}${req.path}`,
          imageUrl: `${appUrl}/og-image.png`,
          robots: "noindex,nofollow,noarchive",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Daylora",
            url: `${appUrl}${req.path}`,
          },
        });
        return res.send(noIndexHtml);
      }

      if (knownPrefixes.has(firstSegment) || firstSegment.startsWith("_")) {
        return res.send(indexHtml);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstSegment);
      if (isUuid) {
        return res.send(indexHtml);
      }

      if (segments.length >= 3 && segments[1] === "guest") {
        return res.send(indexHtml);
      }

      try {
        const wedding = await storage.getWeddingBySlug(firstSegment);

        if (!wedding) {
          res.status(404);
          return res.send(indexHtml);
        }

        if (!wedding.isPublished) {
          const isOwner = !!(req as any).user && (req as any).user.id === wedding.ownerId;
          if (!isOwner) {
            res.status(404);
            return res.send(indexHtml);
          }
        }

        const heroTitle = wedding.config?.texts?.heroTitle || wedding.title || "Notre Mariage";
        const seoTitle = wedding.config?.seo?.title || `Mariage de ${heroTitle}`;
        const seoDesc = wedding.config?.seo?.description || `Vous êtes invité(e) au mariage de ${heroTitle}. Découvrez tous les détails et confirmez votre présence.`;
        const seoImage = wedding.config?.seo?.ogImage || wedding.config?.media?.couplePhoto || `${appUrl}/og-image.png`;
        const pageUrl = `${appUrl}/${wedding.slug}`;

        const eventStartDate = wedding.weddingDate ? new Date(wedding.weddingDate).toISOString() : undefined;
        const locationName = wedding.config?.sections?.locationItems?.[0]?.title || undefined;
        const locationAddress = wedding.config?.sections?.locationItems?.[0]?.address || undefined;

        const injected = injectSeoHtml(indexHtml, {
          title: seoTitle,
          description: seoDesc,
          canonicalUrl: pageUrl,
          imageUrl: seoImage,
          locale: (wedding.config?.language || "fr") === "en" ? "en_US" : "fr_FR",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Event",
            name: seoTitle,
            description: seoDesc,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            startDate: eventStartDate,
            image: [seoImage],
            url: pageUrl,
            organizer: {
              "@type": "Organization",
              name: "Daylora",
              url: appUrl,
            },
            location: locationName || locationAddress
              ? {
                  "@type": "Place",
                  name: locationName || wedding.title,
                  address: locationAddress || "",
                }
              : undefined,
          },
        });

        return res.send(injected);
      } catch {
        return res.send(indexHtml);
      }
    });
  } else {
    app.get("/", (_req, res) => res.status(200).type("text/plain").send("ok"));
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: false,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
