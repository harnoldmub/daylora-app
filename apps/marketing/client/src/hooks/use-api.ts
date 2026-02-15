import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type Wedding,
    type RsvpResponse,
    type Gift,
    type Contribution,
    type InsertWedding,
    type InsertRsvpResponse,
    type InsertGift,
    type EmailLog
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to manage the current wedding context based on slug or user ownership.
 */
export function useWedding(slug?: string) {
    return useQuery<Wedding>({
        queryKey: ["/api/weddings", slug],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (slug) {
                const isUuid = /^[0-9a-fA-F-]{36}$/.test(slug);
                if (isUuid) {
                    headers["x-wedding-id"] = slug;
                } else {
                    headers["x-wedding-slug"] = slug;
                }
            }
            const res = await fetch("/api/weddings", {
                headers,
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch wedding");
            const weddings = await res.json();
            return Array.isArray(weddings) ? weddings[0] : weddings;
        },
        enabled: !!slug || true,
    });
}
export function useUpdateWedding() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Wedding> & { id: string }) => {
            const res = await apiRequest("PATCH", `/api/weddings/${data.id}`, data);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
        },
    });
}

/**
 * Guests / RSVP Hooks
 */
export function useGuests() {
    return useQuery<RsvpResponse[]>({
        queryKey: ["/api/rsvp"],
    });
}

export function useCreateRsvp() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: InsertRsvpResponse) => {
            const res = await apiRequest("POST", "/api/rsvp", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
            toast({ title: "Succès", description: "Votre réponse a été enregistrée." });
        },
    });
}

/**
 * Gifts Hooks
 */
export function useGifts() {
    return useQuery<Gift[]>({
        queryKey: ["/api/gifts"],
    });
}

export function useCreateGift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: InsertGift) => {
            const res = await apiRequest("POST", "/api/gifts", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
        },
    });
}

/**
 * Contributions Hooks
 */
export function useContributions() {
    return useQuery<Contribution[]>({
        queryKey: ["/api/contributions"],
    });
}

/**
 * Real-time SSE Sync (Internal helper for Components)
 */
export function useLiveEvents(weddingId?: string) {
    return useQuery({
        queryKey: ["/api/live/stream", weddingId],
        enabled: !!weddingId,
        // Note: Actual SSE handling is usually done via a dedicated hook or service
        // This is a placeholder for the API binding.
    });
}

/**
 * Email logs for audit
 */
export function useEmailLogs() {
    return useQuery<EmailLog[]>({
        queryKey: ["/api/admin/email-logs"],
    });
}
