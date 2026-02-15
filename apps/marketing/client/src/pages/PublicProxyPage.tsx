import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";

export default function PublicProxyPage() {
  const params = useParams<{ slug: string } & Record<string, string>>();
  const [appBaseUrl, setAppBaseUrl] = useState<string>("http://localhost:5174");

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((cfg) => setAppBaseUrl(cfg.appBaseUrl || "http://localhost:5174"))
      .catch(() => null);
  }, []);

  const slug = params.slug;
  const rest = (params as any)["page*"] as string | undefined;
  const page = rest ? `/${rest}` : "";

  const src = useMemo(() => `${appBaseUrl}/${slug}${page}`, [appBaseUrl, slug, page]);

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <div className="h-14 border-b bg-white/80 backdrop-blur flex items-center justify-between px-6">
        <div className="text-sm text-muted-foreground">Prévisualisation publique</div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary"
        >
          Ouvrir dans un nouvel onglet
        </a>
      </div>
      <iframe
        src={src}
        title="Public wedding site"
        className="w-full h-[calc(100vh-56px)] border-0"
      />
    </div>
  );
}
