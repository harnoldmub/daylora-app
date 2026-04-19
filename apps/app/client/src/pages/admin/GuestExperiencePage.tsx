import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpdateWedding, useWedding } from "@/hooks/use-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PremiumAccessGate } from "@/components/admin/PremiumAccessGate";
import type {
  GuestExperienceInvitationType,
  GuestExperienceOption,
  GuestExperienceSegment,
  GuestExperienceTable,
} from "@shared/schema";

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

type GuestExperienceConfig = {
  invitationTypes: GuestExperienceInvitationType[];
  eventSegments: GuestExperienceSegment[];
  eventOptions: GuestExperienceOption[];
  tables: GuestExperienceTable[];
  checkInSettings: {
    allowMassCheckIn?: boolean;
    showPendingOnlyByDefault?: boolean;
  };
};

const emptyConfig: GuestExperienceConfig = {
  invitationTypes: [],
  eventSegments: [],
  eventOptions: [],
  tables: [],
  checkInSettings: {
    allowMassCheckIn: true,
    showPendingOnlyByDefault: false,
  },
};

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>;
}

export default function GuestExperiencePage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding, isLoading } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();
  const { toast } = useToast();
  const [draft, setDraft] = useState<GuestExperienceConfig>(emptyConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = ((wedding?.config?.sections as any)?.guestExperience || emptyConfig) as GuestExperienceConfig;
    setDraft({
      invitationTypes: next.invitationTypes || [],
      eventSegments: next.eventSegments || [],
      eventOptions: next.eventOptions || [],
      tables: next.tables || [],
      checkInSettings: next.checkInSettings || emptyConfig.checkInSettings,
    });
  }, [wedding]);

  if (isLoading || !wedding) {
    return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        config: {
          sections: {
            guestExperience: draft,
          } as any,
        },
      });
      toast({ title: "Configuration enregistrée", description: "L'expérience invités est à jour." });
    } catch (error: any) {
      toast({ title: "Enregistrement impossible", description: error?.message || "Impossible d'enregistrer.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumAccessGate
      isPremium={true}
      featureName="L'Expérience Invités"
      description="Personnalisez chaque détail : types d'invitation, segments de l'événement, options payantes et gestion des tables."
    >
      <div className="space-y-8">
        <AdminPageHeader
          title="Expérience invités"
          description="Personnalisez ce que chaque invité voit et reçoit, avec des mots simples et des réglages faciles à comprendre."
          actions={<Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>}
        />

        <Card className="p-6 space-y-4">
          <SectionIntro
            title="Accueil le jour J"
            description="Réglez ici la façon dont l'équipe d'accueil enregistre l'arrivée des invités."
          />
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Permettre de valider plusieurs arrivées d'un coup</p>
              <p className="text-sm text-muted-foreground">Pratique si l'accueil doit faire entrer un groupe rapidement.</p>
            </div>
            <Switch
              checked={draft.checkInSettings.allowMassCheckIn ?? true}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, checkInSettings: { ...prev.checkInSettings, allowMassCheckIn: checked } }))}
            />
          </div>
        </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionIntro
            title="Types d'invitation"
            description="Créez des formats d'invitation différents selon les invités : journée complète, soirée uniquement, brunch..."
          />
          <Button
            variant="outline"
            onClick={() => setDraft((prev) => ({
              ...prev,
              invitationTypes: [...prev.invitationTypes, { id: createId("type"), label: "Nouvelle invitation", description: "", enabled: true, segmentIds: [], optionIds: [] }],
            }))}
          >
            Ajouter
          </Button>
        </div>
        {draft.invitationTypes.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nom de cette invitation</Label>
                <Input value={item.label} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.invitationTypes];
                  next[index] = { ...next[index], label: e.target.value };
                  return { ...prev, invitationTypes: next };
                })} />
                <FieldHelp>Exemple : Journée complète, Soirée uniquement, Brunch.</FieldHelp>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={item.enabled} onCheckedChange={(checked) => setDraft((prev) => {
                    const next = [...prev.invitationTypes];
                    next[index] = { ...next[index], enabled: checked };
                    return { ...prev, invitationTypes: next };
                  })} />
                  <span className="text-sm">Visible dans vos réglages</span>
                </div>
                <Button variant="ghost" onClick={() => setDraft((prev) => ({ ...prev, invitationTypes: prev.invitationTypes.filter((_, i) => i !== index) }))}>Supprimer</Button>
              </div>
            </div>
            <div>
              <Label>Petite explication</Label>
              <Textarea value={item.description || ""} onChange={(e) => setDraft((prev) => {
                const next = [...prev.invitationTypes];
                next[index] = { ...next[index], description: e.target.value };
                return { ...prev, invitationTypes: next };
              })} />
              <FieldHelp>Cette phrase vous aide à reconnaître rapidement ce type d'invitation dans l'admin.</FieldHelp>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionIntro
            title="Moments de la journée"
            description="Ajoutez les moments importants de l'événement : cérémonie, cocktail, dîner, soirée, brunch..."
          />
          <Button
            variant="outline"
            onClick={() => setDraft((prev) => ({
              ...prev,
              eventSegments: [...prev.eventSegments, { id: createId("segment"), label: "Nouveau segment", time: "", venueLabel: "", venueAddress: "", description: "", enabled: true, invitationTypeIds: [], sortOrder: prev.eventSegments.length }],
            }))}
          >
            Ajouter
          </Button>
        </div>
        {draft.eventSegments.map((segment, index) => (
          <div key={segment.id} className="grid gap-3 rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Nom du moment</Label>
                <Input value={segment.label} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventSegments];
                  next[index] = { ...next[index], label: e.target.value };
                  return { ...prev, eventSegments: next };
                })} />
                <FieldHelp>Exemple : Cérémonie, Cocktail, Dîner, Soirée.</FieldHelp>
              </div>
              <div>
                <Label>Heure</Label>
                <Input value={segment.time || ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventSegments];
                  next[index] = { ...next[index], time: e.target.value };
                  return { ...prev, eventSegments: next };
                })} />
                <FieldHelp>Exemple : 16h00 ou 19:30.</FieldHelp>
              </div>
              <div>
                <Label>Nom du lieu</Label>
                <Input value={segment.venueLabel || ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventSegments];
                  next[index] = { ...next[index], venueLabel: e.target.value };
                  return { ...prev, eventSegments: next };
                })} />
                <FieldHelp>Exemple : Mairie, Domaine, Salle de réception.</FieldHelp>
              </div>
            </div>
            <div>
              <Label>Information à afficher aux invités</Label>
              <Textarea value={segment.description || ""} onChange={(e) => setDraft((prev) => {
                const next = [...prev.eventSegments];
                next[index] = { ...next[index], description: e.target.value };
                return { ...prev, eventSegments: next };
              })} />
              <FieldHelp>Ajoutez ici un petit texte utile : tenue, consigne, heure d'arrivée, précision pratique.</FieldHelp>
            </div>
            <div className="space-y-2">
              <Label>Qui voit ce moment ?</Label>
              <FieldHelp>Cochez les types d'invitation qui doivent voir ce moment sur leur page.</FieldHelp>
              <div className="flex flex-wrap gap-3">
                {draft.invitationTypes.map((type) => (
                  <label key={type.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={segment.invitationTypeIds.includes(type.id)}
                      onChange={(e) => setDraft((prev) => {
                        const next = [...prev.eventSegments];
                        const current = next[index].invitationTypeIds || [];
                        next[index] = {
                          ...next[index],
                          invitationTypeIds: e.target.checked ? [...current, type.id] : current.filter((id) => id !== type.id),
                        };
                        return { ...prev, eventSegments: next };
                      })}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionIntro
            title="Options en plus"
            description="Ajoutez ici ce qui n'est pas inclus pour tout le monde, par exemple un brunch, un after ou une activité en option."
          />
          <Button
            variant="outline"
            onClick={() => setDraft((prev) => ({
              ...prev,
              eventOptions: [...prev.eventOptions, { id: createId("option"), label: "Nouvelle option", description: "", enabled: true, time: "", venueLabel: "", venueAddress: "", priceCents: null, invitationTypeIds: [] }],
            }))}
          >
            Ajouter
          </Button>
        </div>
        {draft.eventOptions.map((option, index) => (
          <div key={option.id} className="grid gap-3 rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Nom de l'option</Label>
                <Input value={option.label} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventOptions];
                  next[index] = { ...next[index], label: e.target.value };
                  return { ...prev, eventOptions: next };
                })} />
                <FieldHelp>Exemple : Brunch du dimanche, After-party, Navette retour.</FieldHelp>
              </div>
              <div>
                <Label>Heure</Label>
                <Input value={option.time || ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventOptions];
                  next[index] = { ...next[index], time: e.target.value };
                  return { ...prev, eventOptions: next };
                })} />
              </div>
              <div>
                <Label>Nom du lieu</Label>
                <Input value={option.venueLabel || ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventOptions];
                  next[index] = { ...next[index], venueLabel: e.target.value };
                  return { ...prev, eventOptions: next };
                })} />
              </div>
              <div>
                <Label>Prix optionnel</Label>
                <Input type="number" value={option.priceCents ?? ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.eventOptions];
                  next[index] = { ...next[index], priceCents: e.target.value ? Number(e.target.value) : null };
                  return { ...prev, eventOptions: next };
                })} />
                <FieldHelp>Laissez vide si cette option est gratuite.</FieldHelp>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={option.enabled} onCheckedChange={(checked) => setDraft((prev) => {
                  const next = [...prev.eventOptions];
                  next[index] = { ...next[index], enabled: checked };
                  return { ...prev, eventOptions: next };
                })} />
                <span className="text-sm">Visible dans vos réglages</span>
              </div>
              <Button variant="ghost" onClick={() => setDraft((prev) => ({ ...prev, eventOptions: prev.eventOptions.filter((_, i) => i !== index) }))}>Supprimer</Button>
            </div>
            <div className="space-y-2">
              <Label>Qui peut voir cette option ?</Label>
              <FieldHelp>Cochez les types d'invitation qui peuvent voir ou recevoir cette option.</FieldHelp>
              <div className="flex flex-wrap gap-3">
                {draft.invitationTypes.map((type) => (
                  <label key={type.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={option.invitationTypeIds.includes(type.id)}
                      onChange={(e) => setDraft((prev) => {
                        const next = [...prev.eventOptions];
                        const current = next[index].invitationTypeIds || [];
                        next[index] = {
                          ...next[index],
                          invitationTypeIds: e.target.checked ? [...current, type.id] : current.filter((id) => id !== type.id),
                        };
                        return { ...prev, eventOptions: next };
                      })}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionIntro
            title="Tables"
            description="Préparez ici vos tables pour mieux organiser le plan de table et afficher la bonne table aux invités."
          />
          <Button
            variant="outline"
            onClick={() => setDraft((prev) => ({
              ...prev,
              tables: [...prev.tables, { id: createId("table"), name: "Nouvelle table", number: null, capacity: null, category: "", notes: "", enabled: true }],
            }))}
          >
            Ajouter
          </Button>
        </div>
        {draft.tables.map((table, index) => (
          <div key={table.id} className="grid gap-3 rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Nom de la table</Label>
                <Input value={table.name} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.tables];
                  next[index] = { ...next[index], name: e.target.value };
                  return { ...prev, tables: next };
                })} />
                <FieldHelp>Exemple : Famille, Amis proches, Prestataires.</FieldHelp>
              </div>
              <div>
                <Label>Numéro</Label>
                <Input type="number" value={table.number ?? ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.tables];
                  next[index] = { ...next[index], number: e.target.value ? Number(e.target.value) : null };
                  return { ...prev, tables: next };
                })} />
                <FieldHelp>Utile si vous affichez des numéros sur place.</FieldHelp>
              </div>
              <div>
                <Label>Nombre de places</Label>
                <Input type="number" value={table.capacity ?? ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.tables];
                  next[index] = { ...next[index], capacity: e.target.value ? Number(e.target.value) : null };
                  return { ...prev, tables: next };
                })} />
                <FieldHelp>Indiquez combien de personnes peuvent s'asseoir à cette table.</FieldHelp>
              </div>
              <div>
                <Label>Type de table</Label>
                <Input value={table.category || ""} onChange={(e) => setDraft((prev) => {
                  const next = [...prev.tables];
                  next[index] = { ...next[index], category: e.target.value };
                  return { ...prev, tables: next };
                })} />
                <FieldHelp>Exemple : VIP, Famille, Amis, Prestataires.</FieldHelp>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={table.enabled} onCheckedChange={(checked) => setDraft((prev) => {
                  const next = [...prev.tables];
                  next[index] = { ...next[index], enabled: checked };
                  return { ...prev, tables: next };
                })} />
                <span className="text-sm">Utilisable dans le plan de table</span>
              </div>
              <Button variant="ghost" onClick={() => setDraft((prev) => ({ ...prev, tables: prev.tables.filter((_, i) => i !== index) }))}>Supprimer</Button>
            </div>
          </div>
        ))}
      </Card>
      </div>
    </PremiumAccessGate>
  );
}
