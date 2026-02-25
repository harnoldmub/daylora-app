import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditorProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    label?: string;
    isTextArea?: boolean;
    canEdit?: boolean;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    editMode?: boolean;
}

export function InlineEditor({
    value,
    onSave,
    label,
    isTextArea = false,
    canEdit = false,
    className,
    inputClassName,
    placeholder,
    editMode = false
}: InlineEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => { setTempValue(value); }, [value]);
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement) {
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (tempValue === value) { setIsEditing(false); return; }
        try {
            setIsSaving(true);
            await onSave(tempValue);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => { setTempValue(value); setIsEditing(false); };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isTextArea && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (!canEdit && !isEditing) {
        return <span className={className}>{value || placeholder}</span>;
    }

    if (isEditing) {
        return (
            <div className="inline-edit-active relative min-w-[180px] animate-in fade-in zoom-in-[0.98] duration-150">
                {label && <label className="text-[10px] tracking-wider uppercase text-muted-foreground/70 mb-1 block font-medium">{label}</label>}
                <div className="flex gap-1.5 items-start">
                    {isTextArea ? (
                        <textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn(
                                "w-full min-h-[80px] resize-y px-3 py-2 rounded-xl",
                                "bg-[#FAF8F5] border border-transparent",
                                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20",
                                "shadow-inner text-foreground placeholder:text-muted-foreground/40",
                                "transition-all duration-200",
                                "text-sm leading-relaxed",
                                inputClassName
                            )}
                            placeholder={placeholder}
                            disabled={isSaving}
                        />
                    ) : (
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn(
                                "w-full h-auto px-3 py-1.5 rounded-xl",
                                "bg-[#FAF8F5] border border-transparent",
                                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20",
                                "shadow-inner text-foreground placeholder:text-muted-foreground/40",
                                "transition-all duration-200",
                                "text-sm",
                                inputClassName
                            )}
                            placeholder={placeholder}
                            disabled={isSaving}
                        />
                    )}
                    <div className="flex gap-1 shrink-0 pt-0.5">
                        <button
                            type="button"
                            className="h-7 w-7 rounded-lg bg-primary/90 hover:bg-primary text-white flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-sm"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            type="button"
                            className="h-7 w-7 rounded-lg bg-muted hover:bg-muted-foreground/10 text-muted-foreground flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "inline-edit-zone relative group/edit cursor-pointer",
                "rounded-xl px-2 -mx-2 py-0.5",
                "border border-transparent",
                "hover:border-dashed hover:border-primary/25",
                "hover:bg-primary/[0.03]",
                "transition-all duration-200 ease-out",
                className
            )}
            onClick={() => canEdit && setIsEditing(true)}
        >
            {value || <span className="opacity-40 italic">{placeholder || "Cliquez pour modifier"}</span>}
            {canEdit && (
                <span className="absolute -top-2.5 -right-2.5 opacity-0 group-hover/edit:opacity-100 transition-all duration-200 scale-90 group-hover/edit:scale-100">
                    <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-primary px-1.5 py-0.5 rounded-full shadow-md border border-primary/10 text-[10px] font-medium">
                        <Pencil className="h-2.5 w-2.5" />
                        Modifier
                    </span>
                </span>
            )}
        </div>
    );
}
