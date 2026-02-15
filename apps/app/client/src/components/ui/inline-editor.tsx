
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditorProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    label?: string;
    isTextArea?: boolean;
    canEdit?: boolean;
    className?: string; // Class for the display text
    inputClassName?: string; // Class for the input/textarea
    placeholder?: string;
    editMode?: boolean; // If true, force edit mode interaction
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

    // Sync tempValue with value prop updates
    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (tempValue === value) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);
            await onSave(tempValue);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
            // Optionally handle error state
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isTextArea && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    // Only allow editing if user has permission AND (editMode is active or simple click-to-edit)
    // For this implementation, we rely on canEdit passed from parent (which checks permissions + edit mode toggle)
    if (!canEdit && !isEditing) {
        return <span className={className}>{value || placeholder}</span>;
    }

    if (isEditing) {
        return (
            <div className="relative group/editor min-w-[200px]">
                {label && <label className="text-xs text-muted-foreground mb-1 block">{label}</label>}
                <div className="flex gap-2 items-start">
                    {isTextArea ? (
                        <Textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn("min-h-[100px] resize-y bg-background text-foreground", inputClassName)}
                            placeholder={placeholder}
                            disabled={isSaving}
                        />
                    ) : (
                        <Input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn("h-auto py-1 bg-background text-foreground", inputClassName)}
                            placeholder={placeholder}
                            disabled={isSaving}
                        />
                    )}
                    <div className="flex flex-col gap-1">
                        <Button
                            size="icon"
                            variant="default"
                            className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("relative group cursor-pointer border border-transparent hover:border-dashed hover:border-primary/50 rounded px-1 -mx-1 transition-colors", className)}
            onClick={() => canEdit && setIsEditing(true)}
            title="Click to edit"
        >
            {value || <span className="opacity-50 italic">{placeholder || "Click to edit"}</span>}
            {canEdit && (
                <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white p-1 rounded-full shadow-lg">
                    <Pencil className="h-3 w-3" />
                </div>
            )}
        </div>
    );
}
