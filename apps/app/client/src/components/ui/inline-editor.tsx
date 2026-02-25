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
    variant?: "light" | "dark";
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
    editMode = false,
    variant = "light"
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

    const isDark = variant === "dark";

    const inputBase = isDark
        ? "bg-white/10 backdrop-blur-md border border-white/20 !text-white placeholder:!text-white/40 shadow-lg caret-white"
        : "bg-[#FAF8F5] border border-transparent shadow-inner text-foreground placeholder:text-muted-foreground/40";

    const focusRing = isDark
        ? "focus:ring-2 focus:ring-white/30 focus:border-white/30"
        : "focus:ring-2 focus:ring-primary/30 focus:border-primary/20";

    const confirmBtnClass = isDark
        ? "bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/20"
        : "bg-primary/90 hover:bg-primary text-white";

    const cancelBtnClass = isDark
        ? "bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 border border-white/10"
        : "bg-muted hover:bg-muted-foreground/10 text-muted-foreground";

    const inputStyle: React.CSSProperties = {
        fontSize: '14px',
        lineHeight: '1.5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        letterSpacing: 'normal',
        textShadow: 'none',
        textTransform: 'none' as const,
        ...(isDark ? { color: '#ffffff' } : { color: '#1a1a1a' }),
    };

    if (isEditing) {
        return (
            <div className="inline-edit-active relative min-w-[180px] animate-in fade-in zoom-in-[0.98] duration-150">
                {label && <label className={cn("text-[10px] tracking-wider uppercase mb-1 block font-medium", isDark ? "text-white/60" : "text-muted-foreground/70")}>{label}</label>}
                <div className="flex gap-1.5 items-start">
                    {isTextArea ? (
                        <textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn(
                                "w-full min-h-[80px] resize-y px-3 py-2 rounded-xl",
                                inputBase, focusRing,
                                "focus:outline-none transition-all duration-200",
                                inputClassName
                            )}
                            style={inputStyle}
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
                                inputBase, focusRing,
                                "focus:outline-none transition-all duration-200",
                                inputClassName
                            )}
                            style={inputStyle}
                            placeholder={placeholder}
                            disabled={isSaving}
                        />
                    )}
                    <div className="flex gap-1 shrink-0 pt-0.5">
                        <button
                            type="button"
                            className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-sm", confirmBtnClass)}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            type="button"
                            className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50", cancelBtnClass)}
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

    const hoverBorder = isDark
        ? "hover:border-white/20"
        : "hover:border-dashed hover:border-primary/25";

    const hoverBg = isDark
        ? "hover:bg-white/[0.06]"
        : "hover:bg-primary/[0.03]";

    const pillClass = isDark
        ? "bg-white/15 backdrop-blur-sm text-white border-white/20"
        : "bg-white/90 backdrop-blur-sm text-primary border-primary/10";

    return (
        <div
            className={cn(
                "inline-edit-zone relative group/edit cursor-pointer",
                "rounded-xl px-2 -mx-2 py-0.5",
                "border border-transparent",
                hoverBorder, hoverBg,
                "transition-all duration-200 ease-out",
                className
            )}
            onClick={() => canEdit && setIsEditing(true)}
        >
            {value || <span className="opacity-40 italic">{placeholder || "Cliquez pour modifier"}</span>}
            {canEdit && (
                <span className="absolute -top-2.5 -right-2.5 opacity-0 group-hover/edit:opacity-100 transition-all duration-200 scale-90 group-hover/edit:scale-100">
                    <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-md border text-[10px] font-medium", pillClass)}>
                        <Pencil className="h-2.5 w-2.5" />
                        Modifier
                    </span>
                </span>
            )}
        </div>
    );
}
