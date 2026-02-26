import { useState } from "react";
import { useLocation } from "wouter";
import { Star, MessageSquarePlus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWedding } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

type FeedbackForm = {
  rating: number;
  title: string;
  message: string;
  contactAllowed: boolean;
  email: string;
};

const emptyForm = (email: string): FeedbackForm => ({
  rating: 0,
  title: "",
  message: "",
  contactAllowed: false,
  email: email || "",
});

export function FeedbackModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: wedding } = useWedding();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FeedbackForm>(emptyForm(user?.email || ""));
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      toast({ title: "Veuillez donner une note", variant: "destructive" });
      return;
    }
    if (!form.message.trim()) {
      toast({ title: "Le message est requis", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          weddingId: wedding?.id || null,
          rating: form.rating,
          title: form.title || null,
          message: form.message,
          contactAllowed: form.contactAllowed,
          email: form.contactAllowed ? form.email : null,
          page: location || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");

      toast({ title: "Merci pour votre avis !" });
      setOpen(false);
      setForm(emptyForm(user?.email || ""));
      setHoveredStar(0);
    } catch {
      toast({ title: "Erreur lors de l'envoi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v) {
        setForm(emptyForm(user?.email || ""));
        setHoveredStar(0);
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-amber-600"
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Donner mon avis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Votre avis compte</h2>
          <p className="text-sm text-white/80 mt-1">Aidez-nous à améliorer Nocely</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Note</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-0.5 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoveredStar || form.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="feedback-title" className="text-sm font-medium">Titre (optionnel)</Label>
            <Input
              id="feedback-title"
              placeholder="Résumez votre avis"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="feedback-message" className="text-sm font-medium">Message *</Label>
            <Textarea
              id="feedback-message"
              placeholder="Décrivez votre expérience, suggestion ou problème..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="mt-1 min-h-[100px]"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="feedback-contact"
              checked={form.contactAllowed}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, contactAllowed: checked === true }))
              }
            />
            <Label htmlFor="feedback-contact" className="text-sm cursor-pointer">
              M'autoriser à être recontacté
            </Label>
          </div>

          {form.contactAllowed && (
            <div>
              <Label htmlFor="feedback-email" className="text-sm font-medium">Email</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
