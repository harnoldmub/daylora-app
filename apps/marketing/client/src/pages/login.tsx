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
import { Loader2, Mail, Heart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { loginMutation, resendVerificationMutation } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isUnverified = loginMutation.error?.message.includes("Veuillez confirmer votre adresse email");

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-blob pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[150px] animate-blob animation-delay-500 pointer-events-none" />

      <Card className="w-full max-w-md glass-morphism relative z-10 border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-10 pb-2">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(200,169,106,0.4)]">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-serif font-bold text-white">Libala</CardTitle>
          <CardDescription className="text-white/40 italic mt-2">Heureux de vous revoir</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-10 pt-4">
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
                    <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jean@exemple.com" {...field} className="glass-morphism border-white/10 h-12 focus:border-primary/50 transition-colors" />
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
                      <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Mot de passe</FormLabel>
                      <Link href="/forgot-password" title="Mot de passe oublié ?" className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">Oublié ?</Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} className="glass-morphism border-white/10 h-12 focus:border-primary/50 transition-colors" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full rounded-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-[0_10px_30px_rgba(200,169,106,0.2)] border-none mt-4 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Se connecter"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm pt-4">
            <span className="text-white/40 font-medium">Pas encore de compte ?</span>{" "}
            <Link href="/onboarding" title="Créer un compte Libala" className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
              Inscrivez-vous
            </Link>
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <button
              onClick={() => setLocation("/")}
              className="text-[10px] uppercase tracking-widest text-white/20 hover:text-primary transition-all font-bold"
            >
              ← Explorer Libala
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
