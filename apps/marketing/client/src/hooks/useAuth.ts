import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";
import { type User } from "@shared/schema";

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({ title: "Connexion réussie", description: "Bon retour parmi nous !" });
      setLocation("/app");
    },
    onError: (error: Error) => {
      // Specialized error handling for unverified emails or invalid credentials
      toast({
        title: "Échec de connexion",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/signup", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Compte créé",
        description: data.message || "Vérifiez vos emails pour activer votre compte."
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      setLocation("/");
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/auth/resend-verification", { email });
    },
    onSuccess: () => {
      toast({ title: "Email envoyé", description: "Un nouveau lien de vérification vous a été adressé." });
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    signupMutation,
    logoutMutation,
    resendVerificationMutation,
  };
}
