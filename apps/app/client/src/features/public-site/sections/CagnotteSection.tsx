import { useState } from "react";
import { Gift as GiftIcon, ExternalLink, Phone, Building2, CreditCard, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function getMethodSubtitle(method: ContributionMethod) {
  switch (method.type) {
    case "paypal": return "Envoyez via PayPal en toute sécurité";
    case "phone": return `Envoyez à ${method.number}`;
    case "link": return "Cliquez pour être redirigé";
    case "bank": return `Au nom de ${method.accountHolder}`;
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
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider opacity-50 hover:opacity-80 transition-opacity"
      style={{ color: 'var(--wedding-primary)' }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié" : label}
    </button>
  );
}

function MethodCard({ method, buttonRadiusClass }: { method: ContributionMethod; buttonRadiusClass: string }) {
  const Icon = getMethodIcon(method.type);
  const isRedirect = method.type === "paypal" || method.type === "link";
  const redirectUrl = method.type === "paypal" ? method.paypalUrl : method.type === "link" ? method.url : "";

  return (
    <div className="border rounded-2xl overflow-hidden transition-all hover:shadow-lg" style={{ borderColor: 'color-mix(in srgb, var(--wedding-primary) 15%, transparent)' }}>
      <div className="p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 8%, transparent)' }}>
          <Icon className="h-6 w-6" style={{ color: 'var(--wedding-primary)' }} />
        </div>
        <h3 className="font-serif text-lg font-light tracking-wide mb-1" style={{ color: 'var(--wedding-primary)' }}>
          {getMethodTitle(method)}
        </h3>
        <p className="text-xs text-muted-foreground mb-5">{getMethodSubtitle(method)}</p>

        {isRedirect && redirectUrl ? (
          <Button
            asChild
            size="lg"
            className={`px-10 py-6 text-xs tracking-[0.2em] uppercase font-semibold shadow-sm hover:scale-[1.02] transition-all ${buttonRadiusClass}`}
            style={{
              backgroundColor: 'var(--wedding-primary)',
              borderColor: 'var(--wedding-primary)',
              color: '#FFFFFF',
            }}
          >
            <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              {method.type === "paypal" ? "Ouvrir PayPal" : "Ouvrir le lien"}
            </a>
          </Button>
        ) : method.type === "phone" ? (
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 5%, transparent)' }}>
              <span className="text-sm font-mono tracking-wide">{method.number}</span>
              <CopyButton text={method.number} label="Copier" />
            </div>
          </div>
        ) : method.type === "bank" ? (
          <div className="space-y-2 text-left">
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 5%, transparent)' }}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Titulaire</div>
              <div className="text-sm font-medium">{method.accountHolder}</div>
            </div>
            {method.accountNumber && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 5%, transparent)' }}>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">N° de compte</div>
                  <div className="font-mono text-sm break-all">{method.accountNumber}</div>
                </div>
                <CopyButton text={method.accountNumber} label="Copier" />
              </div>
            )}
            {method.iban && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 5%, transparent)' }}>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">IBAN</div>
                  <div className="font-mono text-sm break-all">{method.iban}</div>
                </div>
                <CopyButton text={method.iban} label="Copier" />
              </div>
            )}
            {method.bic && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 5%, transparent)' }}>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">BIC</div>
                  <div className="font-mono text-sm">{method.bic}</div>
                </div>
                <CopyButton text={method.bic} label="Copier" />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
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
          <div className="mt-10 flex flex-col items-center gap-4">
            {enabledMethods.map((method) => (
              <div key={method.id} className="w-full max-w-md">
                <MethodCard method={method} buttonRadiusClass={buttonRadiusClass} />
              </div>
            ))}
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
