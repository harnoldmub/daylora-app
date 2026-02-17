import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [path] = useLocation();

  // If we're under a public wedding route, send users back to the wedding home,
  // not the app root ("/" redirects to /app).
  const homeHref = (() => {
    const parts = path.split("?")[0].split("#")[0].split("/").filter(Boolean);
    if (!parts.length) return "/app";
    if (parts[0] === "preview" && parts[1]) return `/preview/${parts[1]}`;
    if (parts[0] === "app") return "/app";
    return `/${parts[0]}`;
  })();

  return (
    <div className="w-full flex flex-1 items-center justify-center bg-background py-16">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>

          <div className="mt-6">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retour au site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
