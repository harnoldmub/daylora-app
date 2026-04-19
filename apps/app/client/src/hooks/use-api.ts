import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
    type Wedding,
    type RsvpResponse,
    type Gift,
    type Contribution,
    type InsertWedding,
    type InsertRsvpResponse,
    type InsertGift,
    type EmailLog,
    type OrganizationChecklistCategory,
    type OrganizationChecklistItem,
    type OrganizationPlanningItem,
    type OrganizationBudgetCategory,
    type OrganizationBudgetItem,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends Array<infer U>
        ? Array<U>
        : T[K] extends object
            ? DeepPartial<T[K]>
            : T[K];
};

export type WeddingPatch = { id: string } & Omit<Partial<Wedding>, "config"> & {
    config?: DeepPartial<Wedding["config"]>;
};

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

export function useWeddings() {
    return useQuery<Wedding[]>({
        queryKey: ["/api/weddings/list"],
        queryFn: async () => {
            const res = await fetch("/api/weddings/list", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch weddings");
            return res.json();
        },
    });
}

export function useCreateWedding() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<InsertWedding> & Record<string, unknown>): Promise<Wedding> => {
            const res = await apiRequest("POST", "/api/weddings", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/weddings/list"] });
        },
    });
}

export function useUpdateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
        mutationFn: async (data: WeddingPatch) => {
            const res = await apiRequest("PATCH", `/api/weddings/${data.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/weddings/list"] });
    },
  });
}

export function useDeleteWedding() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/weddings/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/weddings/list"] });
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

export function usePublicGifts(enabled = true) {
    return useQuery<Gift[]>({
        queryKey: ["/api/gifts/public"],
        enabled,
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

export type ChecklistCategorySummary = OrganizationChecklistCategory & {
    items: OrganizationChecklistItem[];
    total: number;
    done: number;
    inProgress: number;
    progress: number;
};

export type ChecklistResponse = {
    categories: ChecklistCategorySummary[];
    totals: {
        total: number;
        done: number;
        inProgress: number;
    };
};

export type PlanningResponse = {
    items: OrganizationPlanningItem[];
    suggestedItems: Array<{
        title: string;
        description?: string | null;
        kind: string;
        dueAt?: string | Date | null;
    }>;
};

export type BudgetResponse = {
    categories: Array<OrganizationBudgetCategory & {
        items: OrganizationBudgetItem[];
        plannedAmountCents: number;
        actualAmountCents: number;
        remainingAmountCents: number;
    }>;
    totals: {
        plannedAmountCents: number;
        actualAmountCents: number;
        remainingAmountCents: number;
    };
};

export type OrganizationProgressResponse = {
    score: number;
    earnedPoints: number;
    totalPoints: number;
    checks: Array<{
        key: string;
        label: string;
        points: number;
        done: boolean;
        description: string;
    }>;
    nextActions: Array<{
        key: string;
        label: string;
        description: string;
    }>;
};

export function useChecklist() {
    const { weddingId } = useParams<{ weddingId: string }>();
    return useQuery<ChecklistResponse>({
        queryKey: ["/api/organization/checklist", weddingId],
        enabled: !!weddingId,
    });
}

export function usePlanning() {
    const { weddingId } = useParams<{ weddingId: string }>();
    return useQuery<PlanningResponse>({
        queryKey: ["/api/organization/planning", weddingId],
        enabled: !!weddingId,
    });
}

export function useBudget() {
    const { weddingId } = useParams<{ weddingId: string }>();
    return useQuery<BudgetResponse>({
        queryKey: ["/api/organization/budget", weddingId],
        enabled: !!weddingId,
    });
}

export function useOrganizationProgress() {
    const { weddingId } = useParams<{ weddingId: string }>();
    return useQuery<OrganizationProgressResponse>({
        queryKey: ["/api/organization/progress", weddingId],
        enabled: !!weddingId,
    });
}

export function useCreateChecklistCategory() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<OrganizationChecklistCategory>) => {
            const res = await apiRequest("POST", "/api/organization/checklist/categories", data);
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/organization/checklist", weddingId] }),
    });
}

export function useCreateChecklistItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<OrganizationChecklistItem>) => {
            const res = await apiRequest("POST", "/api/organization/checklist/items", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/checklist", weddingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/organization/progress", weddingId] });
        },
    });
}

export function useUpdateChecklistItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<OrganizationChecklistItem> & { id: number }) => {
            const res = await apiRequest("PATCH", `/api/organization/checklist/items/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/checklist", weddingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/organization/progress", weddingId] });
        },
    });
}

export function useDeleteChecklistItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/organization/checklist/items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/checklist", weddingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/organization/progress", weddingId] });
        },
    });
}

export function useCreatePlanningItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<OrganizationPlanningItem>) => {
            const res = await apiRequest("POST", "/api/organization/planning/items", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/planning", weddingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/organization/progress", weddingId] });
        },
    });
}

export function useUpdatePlanningItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<OrganizationPlanningItem> & { id: number }) => {
            const res = await apiRequest("PATCH", `/api/organization/planning/items/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/planning", weddingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/organization/progress", weddingId] });
        },
    });
}

export function useDeletePlanningItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/organization/planning/items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/planning", weddingId] });
            queryClient.invalidateQueries({ queryKey: ["/api/organization/progress", weddingId] });
        },
    });
}

export function useCreateBudgetCategory() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<OrganizationBudgetCategory>) => {
            const res = await apiRequest("POST", "/api/organization/budget/categories", data);
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/organization/budget", weddingId] }),
    });
}

export function useCreateBudgetItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<OrganizationBudgetItem>) => {
            const res = await apiRequest("POST", "/api/organization/budget/items", data);
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/organization/budget", weddingId] }),
    });
}

export function useUpdateBudgetItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<OrganizationBudgetItem> & { id: number }) => {
            const res = await apiRequest("PATCH", `/api/organization/budget/items/${id}`, data);
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/organization/budget", weddingId] }),
    });
}

export function useDeleteBudgetItem() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/organization/budget/items/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/organization/budget", weddingId] }),
    });
}
