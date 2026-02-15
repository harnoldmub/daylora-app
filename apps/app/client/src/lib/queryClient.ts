import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const json = JSON.parse(text);
      if (json.message) {
        throw new Error(json.message);
      }
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isAuthEndpoint = url.startsWith("/api/auth");
  // Resolve wedding context from URL (admin) or slug (public)
  const urlParams = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const previewMatch = path.match(/^\/preview\/([^/]+)/);
  const publicMatch = path.match(/^\/([^/]+)/);
  const pathSlug = previewMatch?.[1] || (!path.startsWith("/app/") ? publicMatch?.[1] : null);
  const slug = urlParams.get("wedding") || pathSlug || localStorage.getItem("last_wedding_slug") || null;
  const isUuid = !!slug && /^[0-9a-fA-F-]{36}$/.test(slug);
  const appMatch = path.match(/^\/app\/([^/]+)/);
  const appPathPart = appMatch?.[1] || null;
  const appWeddingId = appPathPart && /^[0-9a-fA-F-]{36}$/.test(appPathPart) ? appPathPart : null;
  const weddingId = appWeddingId || (isUuid ? slug : null);

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(!isAuthEndpoint && !isUuid && slug ? { "x-wedding-slug": slug } : {}),
      ...(!isAuthEndpoint && weddingId ? { "x-wedding-id": weddingId } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
      const urlParams = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      const previewMatch = path.match(/^\/preview\/([^/]+)/);
      const publicMatch = path.match(/^\/([^/]+)/);
      const pathSlug = previewMatch?.[1] || (!path.startsWith("/app/") ? publicMatch?.[1] : null);
      const slug = urlParams.get("wedding") || pathSlug || localStorage.getItem("last_wedding_slug") || null;
      const isUuid = !!slug && /^[0-9a-fA-F-]{36}$/.test(slug);
      const appMatch = path.match(/^\/app\/([^/]+)/);
      const appPathPart = appMatch?.[1] || null;
      const appWeddingId = appPathPart && /^[0-9a-fA-F-]{36}$/.test(appPathPart) ? appPathPart : null;
      const weddingId = appWeddingId || (isUuid ? slug : null);

      const res = await fetch(url, {
        headers: {
          ...(!isAuthEndpoint && !isUuid && slug ? { "x-wedding-slug": slug } : {}),
          ...(!isAuthEndpoint && weddingId ? { "x-wedding-id": weddingId } : {}),
        },
        credentials: "include",
      });

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
