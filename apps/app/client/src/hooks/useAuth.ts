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
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) {
          // Don't block login/signup screens when API returns transient errors in dev.
          if (res.status >= 500) return null;
          const text = await res.text();
          throw new Error(text || "Impossible de récupérer la session");
        }
        return await res.json();
      } catch {
        // Network/proxy error: treat as logged-out state to avoid render loops.
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
      setLocation("/");
    },
    onError: (error: Error) => {
      const msg = error.message || "";
      let title = "Connexion impossible";
      let description = "Identifiants incorrects. Vérifiez votre email et votre mot de passe.";

      if (msg.includes("Veuillez confirmer votre adresse email") || msg.includes("non vérifié")) {
        title = "Email non vérifié";
        description = msg;
      } else if (msg.includes("introuvable") || msg.includes("Aucun compte")) {
        title = "Compte introuvable";
        description = "Aucun compte n'est associé à cette adresse email. Vérifiez l'adresse ou créez un compte.";
      } else if (msg.includes("mot de passe") || msg.includes("incorrect")) {
        title = "Mot de passe incorrect";
        description = "Le mot de passe saisi est incorrect. Réessayez ou cliquez sur « Oublié ? » pour le réinitialiser.";
      } else if (msg.includes("session") || msg.includes("expiré")) {
        title = "Session expirée";
        description = "Votre session a expiré. Merci de vous reconnecter.";
      } else if (msg) {
        description = msg;
      }

      toast({
        title,
        description,
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
    },
    onError: (error: Error) => {
      const msg = error.message || "";
      let title = "Inscription impossible";
      let description = "Impossible de créer votre compte. Vérifiez les informations saisies et réessayez.";

      if (msg.includes("existe déjà") || msg.includes("déjà utilisé")) {
        title = "Adresse email déjà utilisée";
        description = "Un compte existe déjà avec cette adresse email. Connectez-vous ou utilisez une autre adresse.";
      } else if (msg.includes("mot de passe")) {
        title = "Mot de passe invalide";
        description = "Le mot de passe doit contenir au moins 8 caractères.";
      } else if (msg.includes("email") && msg.includes("invalide")) {
        title = "Email invalide";
        description = "Veuillez saisir une adresse email valide.";
      } else if (msg) {
        description = msg;
      }

      toast({
        title,
        description,
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
      setLocation("/login");
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/auth/resend-verification", { email });
    },
    onSuccess: () => {
      toast({ title: "Email envoyé", description: "Un nouveau lien de vérification vous a été envoyé. Pensez à vérifier vos spams." });
    },
    onError: (error: Error) => {
      toast({
        title: "Envoi impossible",
        description: error.message || "Impossible d'envoyer l'email de vérification. Veuillez réessayer dans quelques instants.",
        variant: "destructive"
      });
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
