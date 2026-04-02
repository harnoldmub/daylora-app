import { useState } from "react";
import { Gift as GiftIcon, ExternalLink, Phone, Building2, CreditCard, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { CagnotteSectionProps } from "@/features/public-site/types";
import type { ContributionMethod } from "@shared/schema";

function getMethodIcon(type: ContributionMethod["type"]) {
  switch (type) {
    case "paypal": return CreditCard;
    case "phone": return Phone;
    case "link": return ExternalLink;
    case "bank": return Building2;
  }
}

function getMethodTitle(method: ContributionMethod) {
  switch (method.type) {
    case "paypal": return "PayPal";
    case "phone": return method.label || "Mobile Money";
    case "link": return method.serviceName || "Lien externe";
    case "bank": return method.bankName || "Virement bancaire";
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié !" : label}
    </Button>
  );
}

function MethodCard({ method, buttonRadiusClass }: { method: ContributionMethod; buttonRadiusClass: string }) {
  const Icon = getMethodIcon(method.type);
  const isRedirect = method.type === "paypal" || method.type === "link";
  const redirectUrl = method.type === "paypal" ? method.paypalUrl : method.type === "link" ? method.url : "";

  return (
    <Card className="overflow-hidden border border-primary/10 hover:border-primary/25 transition-all hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">{getMethodTitle(method)}</h3>
          </div>
        </div>

        <div className="mt-4">
          {isRedirect && redirectUrl ? (
            <Button asChild className={`w-full ${buttonRadiusClass}`} size="sm">
              <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                {method.type === "paypal" ? "Ouvrir PayPal" : "Ouvrir le lien"}
              </a>
            </Button>
          ) : method.type === "phone" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-mono flex-1">{method.number}</span>
                <CopyButton text={method.number} label="Copier" />
              </div>
            </div>
          ) : method.type === "bank" ? (
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Titulaire</div>
                <div className="text-xs font-medium">{method.accountHolder}</div>
              </div>
              {method.accountNumber && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">N° de compte</div>
                    <div className="font-mono text-xs break-all">{method.accountNumber}</div>
                  </div>
                  <CopyButton text={method.accountNumber} label="Copier" />
                </div>
              )}
              {method.iban && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IBAN</div>
                    <div className="font-mono text-xs break-all">{method.iban}</div>
                  </div>
                  <CopyButton text={method.iban} label="Copier" />
                </div>
              )}
              {method.bic && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">BIC</div>
                    <div className="font-mono text-xs">{method.bic}</div>
                  </div>
                  <CopyButton text={method.bic} label="Copier" />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function CagnotteSection({
  tokens,
  cagnotteTitle,
  cagnotteDescription,
  contributionMethods,
  buttonRadiusClass,
  onSaveText,
  canEdit,
  editMode,
  order,
}: CagnotteSectionProps) {
  const enabledMethods = contributionMethods.filter((m) => m.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section
      id="cagnotte"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.cagnotte.section}`}
    >
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 10%, transparent)' }}>
          <GiftIcon className="h-8 w-8" style={{ color: 'var(--wedding-primary)' }} />
        </div>
        <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 tracking-wide" style={{ color: 'var(--wedding-primary)' }}>
          <InlineEditor
            value={cagnotteTitle}
            onSave={(val) => onSaveText("cagnotteTitle", val)}
            canEdit={canEdit && editMode}
          />
        </h2>
        <div className="opacity-60 leading-relaxed max-w-2xl mx-auto text-base">
          <InlineEditor
            value={cagnotteDescription}
            onSave={(val) => onSaveText("cagnotteDescription", val)}
            canEdit={canEdit && editMode}
            isTextArea
          />
        </div>

        {enabledMethods.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-left">
              {enabledMethods.map((method) => (
                <MethodCard key={method.id} method={method} buttonRadiusClass={buttonRadiusClass} />
              ))}
            </div>
          </div>
        )}

        {enabledMethods.length === 0 && canEdit && editMode && (
          <div className="mt-10 flex justify-center animate-in fade-in duration-200">
            <div className="text-xs text-muted-foreground/50 font-medium px-5 py-2.5 rounded-full border border-dashed border-muted-foreground/20">
              Configurez vos moyens de contribution dans le design (section cagnotte)
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
