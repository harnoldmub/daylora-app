import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signupSchema, loginSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Heart, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Login() {
  const [, setLocation] = useLocation();
  const { loginMutation, resendVerificationMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isUnverified = loginMutation.error?.message.includes("Veuillez confirmer votre adresse email");

  const searchParams = new URLSearchParams(window.location.search);
  const justCreated = searchParams.get("created") === "1";
  const oauthError = searchParams.get("error");

  useEffect(() => {
    document.title = "Nocely – Connexion";
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery && !form.getValues("email")) {
      form.setValue("email", emailFromQuery);
    }
  }, [form]);

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#2b2320] flex items-center justify-center p-6 relative">
      <div className="absolute -top-20 right-0 w-64 h-64 bg-[#E7D9C8]/60 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#D7C6B2]/40 rounded-full blur-[140px]" />

      <Card className="w-full max-w-md bg-white border border-[#E6DCCF] shadow-xl rounded-[1.5rem] overflow-hidden relative z-10">
        <CardHeader className="text-center pt-10 pb-2">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-serif font-bold text-[#2b2320]">Nocely</CardTitle>
          <CardDescription className="text-[#7A6B5E] italic mt-2">Connectez-vous à votre espace Nocely</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-10 pt-4">
          {justCreated && (
            <Alert className="bg-green-50 text-green-800 border-green-200 rounded-2xl">
              <Heart className="h-4 w-4" />
              <AlertTitle className="font-bold">Compte créé avec succès !</AlertTitle>
              <AlertDescription className="text-xs">
                Vérifiez vos emails pour activer votre compte, puis connectez-vous.
              </AlertDescription>
            </Alert>
          )}

          {isUnverified && (
            <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-2xl">
              <Mail className="h-4 w-4" />
              <AlertTitle className="font-bold">Email non vérifié</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-xs">Merci de confirmer votre inscription via le lien envoyé par email.</p>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-destructive font-bold underline text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    resendVerificationMutation.mutate(form.getValues("email"));
                  }}
                  disabled={resendVerificationMutation.isPending}
                >
                  {resendVerificationMutation.isPending ? "Envoi..." : "Renvoyer l'email de confirmation"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username"
                        placeholder="jean@exemple.com"
                        {...field}
                        className="bg-white border-[#E6DCCF] h-12 focus:border-primary/50 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Mot de passe</FormLabel>
                      <Link href="/forgot-password" title="Mot de passe oublié ?" className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">Oublié ?</Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          {...field}
                          className="bg-white border-[#E6DCCF] h-12 focus:border-primary/50 transition-colors pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6A796] hover:text-[#6B5B4F] transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full rounded-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-md border-none mt-4 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Se connecter"}
              </Button>
            </form>
          </Form>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 border-t border-[#EFE7DD]" />
            <span className="text-[10px] uppercase tracking-widest text-[#B6A796] font-bold">ou</span>
            <div className="flex-1 border-t border-[#EFE7DD]" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => window.location.href = "/api/auth/google"}
              className="w-full h-12 rounded-full border border-[#E6DCCF] bg-white hover:bg-[#F7F3EE] transition-colors flex items-center justify-center gap-3 text-sm font-semibold text-[#2b2320]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </button>
            <button
              type="button"
              onClick={() => window.location.href = "/api/auth/apple/redirect"}
              className="w-full h-12 rounded-full border border-[#E6DCCF] bg-[#000] hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-3 text-sm font-semibold text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continuer avec Apple
            </button>
          </div>

          <div className="text-center text-sm pt-4">
            <span className="text-[#7A6B5E] font-medium">Pas encore de compte ?</span>{" "}
            <Link href="/onboarding" title="Créer un compte Nocely" className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
              Inscrivez-vous
            </Link>
          </div>

          <div className="pt-8 border-t border-[#EFE7DD] text-center">
            <button
              onClick={() => window.location.href = "https://nocely.app/"}
              className="text-[10px] uppercase tracking-widest text-[#B6A796] hover:text-primary transition-all font-bold"
            >
              ← Découvrir Nocely
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
