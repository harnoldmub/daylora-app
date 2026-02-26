import { QueryClient, QueryFunction } from "@tanstack/react-query";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/;

const FRIENDLY_ERRORS: Record<number, string> = {
  400: "Requête invalide. Vérifiez les informations saisies.",
  401: "Votre session a expiré. Merci de vous reconnecter.",
  402: "Cette fonctionnalité nécessite un abonnement actif.",
  403: "Vous n'avez pas accès à cette ressource.",
  404: "La ressource demandée est introuvable.",
  409: "Un conflit est survenu. Rechargez la page et réessayez.",
  413: "Le fichier envoyé est trop volumineux.",
  429: "Trop de requêtes. Veuillez patienter quelques instants.",
  500: "Une erreur est survenue. Veuillez réessayer.",
  502: "Le serveur est temporairement indisponible. Réessayez dans quelques instants.",
  503: "Service momentanément indisponible. Réessayez plus tard.",
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || "";
    try {
      const json = JSON.parse(text);
      if (json.message) {
        throw new Error(json.message);
      }
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
    }
    throw new Error(FRIENDLY_ERRORS[res.status] || "Une erreur est survenue. Réessayez plus tard.");
  }
}

function resolveWeddingContext() {
  const urlParams = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  const isAdminRoute = UUID_REGEX.test(firstSegment);
  const previewMatch = path.match(/^\/preview\/([^/]+)/);

  const pathSlug = previewMatch?.[1] || (!isAdminRoute && firstSegment && !["login", "signup", "verify-email", "forgot-password", "reset-password", "onboarding", "contribution", "invitation", "checkin", "dashboard", "preview", "assets"].includes(firstSegment) ? firstSegment : null);

  const slug = urlParams.get("wedding") || pathSlug || localStorage.getItem("last_wedding_slug") || null;
  const isUuid = !!slug && /^[0-9a-fA-F-]{36}$/.test(slug);
  const appWeddingId = isAdminRoute ? firstSegment : null;
  const weddingId = appWeddingId || (isUuid ? slug : null);

  return { slug, isUuid, weddingId };
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isAuthEndpoint = url.startsWith("/api/auth");
  const { slug, isUuid, weddingId } = resolveWeddingContext();

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(!isAuthEndpoint && !isUuid && slug ? { "x-wedding-slug": slug } : {}),
        ...(!isAuthEndpoint && weddingId ? { "x-wedding-id": weddingId } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch {
    throw new Error("Connexion perdue. Vérifiez votre connexion internet.");
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const url = String(queryKey[0] || "");
      const isAuthEndpoint = url.startsWith("/api/auth");
      const { slug, isUuid, weddingId } = resolveWeddingContext();

      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            ...(!isAuthEndpoint && !isUuid && slug ? { "x-wedding-slug": slug } : {}),
            ...(!isAuthEndpoint && weddingId ? { "x-wedding-id": weddingId } : {}),
          },
          credentials: "include",
        });
      } catch {
        throw new Error("Connexion perdue. Vérifiez votre connexion internet.");
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
