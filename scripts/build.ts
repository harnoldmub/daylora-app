import { execSync } from "child_process";
import { rmSync, mkdirSync, cpSync } from "fs";
import { buildSync } from "esbuild";

const log = (msg: string) => console.log(`\x1b[36m[build]\x1b[0m ${msg}`);

log("Cleaning dist/...");
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

log("Building frontend (Vite)...");
execSync("npm --prefix apps/app run build", { stdio: "inherit" });

log("Copying frontend assets...");
cpSync("apps/app/dist/public", "dist/public", { recursive: true });

log("Building backend (esbuild)...");
buildSync({
  entryPoints: ["apps/api/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  external: [
    "argon2",
    "bcryptjs",
    "better-sqlite3",
    "stripe-replit-sync",
    "@neondatabase/serverless",
    "pg-native",
    "bufferutil",
    "utf-8-validate",
  ],
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
  packages: "external",
});

log("Build complete!");
