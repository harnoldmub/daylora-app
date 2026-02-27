import { useState } from "react";
import { useLocation } from "wouter";
import { Star, MessageSquarePlus, Loader2, Bug, Lightbulb, Rocket, HelpCircle, Camera, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWedding } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FeedbackHistory } from "./FeedbackHistory";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-500 bg-red-50 border-red-200" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-amber-500 bg-amber-50 border-amber-200" },
  { value: "improvement", label: "Amélioration", icon: Rocket, color: "text-blue-500 bg-blue-50 border-blue-200" },
  { value: "other", label: "Autre", icon: HelpCircle, color: "text-gray-500 bg-gray-50 border-gray-200" },
] as const;

type FeedbackForm = {
  type: string;
  message: string;
  rating: number;
  screenshotFile: File | null;
};

const emptyForm: FeedbackForm = {
  type: "",
  message: "",
  rating: 0,
  screenshotFile: null,
};

export function FeedbackModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: wedding } = useWedding();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState<FeedbackForm>({ ...emptyForm });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, screenshotFile: file }));
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) {
      toast({ title: "Type de feedback requis", description: "Veuillez sélectionner un type (bug, suggestion, amélioration ou autre).", variant: "destructive" });
      return;
    }
    if (!form.message.trim()) {
      toast({ title: "Message requis", description: "Veuillez décrire votre retour avant d'envoyer.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;

      if (form.screenshotFile) {
        const formData = new FormData();
        formData.append("file", form.screenshotFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          screenshotUrl = data.url || null;
        }
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          weddingId: wedding?.id || null,
          type: form.type,
          message: form.message,
          rating: form.rating || null,
          currentUrl: location || null,
          screenshotUrl,
        }),
      });
      if (!res.ok) throw new Error("Impossible d'envoyer votre feedback.");

      toast({ title: "Merci pour votre retour ❤️" });
      setOpen(false);
      setForm({ ...emptyForm });
      setHoveredStar(0);
      setScreenshotPreview(null);
    } catch {
      toast({ title: "Envoi impossible", description: "Impossible d'envoyer votre feedback pour le moment. Veuillez réessayer.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex gap-1">
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setForm({ ...emptyForm });
            setHoveredStar(0);
            setScreenshotPreview(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-sidebar-foreground/70 hover:text-amber-600"
              data-feedback-trigger
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl" aria-describedby="feedback-desc">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <DialogTitle className="text-lg font-semibold text-white">Donnez votre feedback</DialogTitle>
              <DialogDescription id="feedback-desc" className="text-sm text-white/80 mt-0.5">Aidez-nous à améliorer Nocely</DialogDescription>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = form.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? `${t.color} ring-2 ring-offset-1 ring-current`
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="feedback-message" className="text-sm font-medium">Message *</Label>
                <Textarea
                  id="feedback-message"
                  placeholder="Décrivez votre retour..."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Note expérience (optionnel)</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-0.5 transition-transform hover:scale-110"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setForm((f) => ({ ...f, rating: f.rating === star ? 0 : star }))}
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
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
                <Label className="text-sm font-medium mb-2 block">Capture d'écran (optionnel)</Label>
                {screenshotPreview ? (
                  <div className="relative rounded-lg border overflow-hidden">
                    <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setScreenshotPreview(null); setForm((f) => ({ ...f, screenshotFile: null })); }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs hover:bg-black/70"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground cursor-pointer hover:border-foreground/30 transition-colors">
                    <Camera className="h-4 w-4" />
                    Ajouter une capture
                    <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                  </label>
                )}
              </div>

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
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
          onClick={() => setHistoryOpen(true)}
          title="Historique de mes feedbacks"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
      <FeedbackHistory open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
