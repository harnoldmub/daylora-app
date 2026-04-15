import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
  GripHorizontal,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PremiumAccessGate } from "@/components/admin/PremiumAccessGate";
import { useWedding } from "@/hooks/use-api";
import { useParams } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useChecklist,
  type ChecklistResponse,
  useCreateChecklistCategory,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  pointerWithin,
  rectIntersection,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { CSS } from "@dnd-kit/utilities";

function EditableInput({ 
  initialValue, 
  onSave, 
  className 
}: { 
  initialValue: string; 
  onSave: (val: string) => void;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (localValue !== initialValue) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

function SortableItem({
  id,
  className,
  children,
}: {
  id: string | number;
  className?: string;
  children: (dragHandleProps: { attributes: any; listeners: any }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl h-[120px] transition-all" 
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners })}
    </div>
  );
}

function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? "bg-primary/[0.03]" : ""}`}>
      {children}
    </div>
  );
}

const STATUS_CONFIG = {
  todo: { label: "À faire", icon: ListTodo, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" },
  in_progress: { label: "En cours", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" },
  done: { label: "Terminées", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
};

const forgivingCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;

  const intersectionHits = rectIntersection(args);
  if (intersectionHits.length > 0) return intersectionHits;

  return closestCorners(args);
};

export default function ChecklistPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding } = useWedding(weddingId);
  const isPremium = wedding?.currentPlan === "premium";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useChecklist();
  const createCategory = useCreateChecklistCategory();
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [quickAddTitles, setQuickAddTitles] = useState<Record<string, string>>({ todo: "", in_progress: "", done: "" });
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [localItems, setLocalItems] = useState<any[]>([]);

  const categories = data?.categories || [];
  const items = useMemo(() => categories.flatMap(c => c.items.map(i => ({ ...i, categoryLabel: c.label }))), [categories]);

  // Sync local items with API data when it loads/changes
  useEffect(() => {
    if (items.length > 0 && localItems.length === 0) {
      setLocalItems(items);
    } else if (items.length === 0) {
      setLocalItems([]);
    }
  }, [items]);

  const columns = {
    todo: localItems.filter(i => i.status === "todo").sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    in_progress: localItems.filter(i => i.status === "in_progress").sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    done: localItems.filter(i => i.status === "done").sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id;
    const draggedId = active.id;

    if (draggedId === overId) return;

    setLocalItems((prev) => {
      const activeIndex = prev.findIndex((item) => item.id === draggedId);
      if (activeIndex === -1) return prev;

      const activeItem = prev[activeIndex];
      const overItem = prev.find((item) => item.id === overId);
      const overStatus = ["todo", "in_progress", "done"].includes(String(overId))
        ? (overId as "todo" | "in_progress" | "done")
        : overItem?.status;

      if (!overStatus) return prev;

      const updatedItems = [...prev];
      const [movedItem] = updatedItems.splice(activeIndex, 1);
      const movedWithStatus =
        movedItem.status === overStatus ? movedItem : { ...movedItem, status: overStatus };

      if (overItem) {
        const overIndexAfterRemoval = updatedItems.findIndex((item) => item.id === overId);
        updatedItems.splice(overIndexAfterRemoval, 0, movedWithStatus);
        return updatedItems;
      }

      const lastIndexInTargetColumn = updatedItems.reduce((lastIndex, item, index) => {
        return item.status === overStatus ? index : lastIndex;
      }, -1);

      updatedItems.splice(lastIndexInTargetColumn + 1, 0, movedWithStatus);
      return updatedItems;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const finalItem = localItems.find(i => i.id === active.id);
    if (!finalItem) return;

    // Calculate sort order within the target column
    const colItems = localItems.filter(i => i.status === finalItem.status);
    const newSortOrder = colItems.findIndex(i => i.id === active.id);

    // Persist to API
    try {
      await updateItem.mutateAsync({ 
        id: finalItem.id as number, 
        status: finalItem.status as any,
        sortOrder: newSortOrder
      });
      // Force sync local items with the final state from server
      queryClient.setQueryData<ChecklistResponse>(["/api/organization/checklist"], (old) => {
        if (!old) return old;
        return {
          ...old,
          categories: old.categories.map(cat => ({
            ...cat,
            items: cat.items.map(item => 
              item.id === finalItem.id ? { ...item, status: finalItem.status as any, sortOrder: newSortOrder } : item
            )
          }))
        };
      });
    } catch (error: any) {
      // Rollback local state on error
      setLocalItems(items);
      toast({ title: "Erreur lors du déplacement", description: error.message, variant: "destructive" });
    }
  };

  const activeItem = activeId ? localItems.find(i => i.id === activeId) : null;

  const handleCreateCategory = async () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    try {
      await createCategory.mutateAsync({ label, key: null, sortOrder: categories.length, isDefault: false });
      setNewCategoryLabel("");
      toast({ title: "Catégorie ajoutée" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleAddItem = async (status: "todo" | "in_progress" | "done") => {
    const title = quickAddTitles[status].trim();
    if (!title || categories.length === 0) return;
    try {
      await createItem.mutateAsync({
        categoryId: categories[0].id,
        title,
        description: null,
        status,
        isDefault: false,
        sortOrder: items.length,
        dueDate: null,
      });
      setQuickAddTitles(prev => ({ ...prev, [status]: "" }));
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in duration-500 px-4">
      <AdminPageHeader
        title="Ma Checklist"
        description="Gérez vos préparatifs. Glissez, déposez, organisez."
      />

      {/* Kanban Board */}
      <PremiumAccessGate 
        isPremium={isPremium} 
        featureName="la checklist intelligente" 
        description="Organisez chaque détail de votre mariage avec un tableau Kanban intuitif, déplacez vos tâches et suivez votre progression en temps réel."
      >
        <DndContext
          sensors={sensors}
          collisionDetection={forgivingCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(Object.entries(STATUS_CONFIG) as [keyof typeof columns, typeof STATUS_CONFIG["todo"]][]).map(([status, config]) => (
              <div key={status} className="flex flex-col h-full min-h-[600px] space-y-4">
                <div className={`p-4 rounded-3xl ${config.bg} border ${config.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                    <h3 className="font-black text-sm uppercase tracking-widest">{config.label}</h3>
                    <Badge variant="secondary" className="bg-white/50 text-[10px] font-bold rounded-full">{columns[status].length}</Badge>
                  </div>
                </div>

                <DroppableColumn id={status} className="flex-1 space-y-3 p-1 rounded-2xl transition-colors min-h-[500px]">
                  {/* Quick Add Placeholder */}
                  <div className="relative group">
                      <Input
                        value={quickAddTitles[status]}
                        onChange={(e) => setQuickAddTitles(p => ({ ...p, [status]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem(status)}
                        placeholder="+ Ajouter une tâche..."
                        className="h-14 bg-white/40 border-dashed border-2 border-border/40 hover:border-primary/20 rounded-2xl px-6 text-sm italic transition-all"
                      />
                      {quickAddTitles[status] && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAddItem(status)}
                          className="absolute right-2 top-1.5 h-11 px-4 rounded-xl"
                        >
                          Ajouter
                        </Button>
                      )}
                  </div>

                  <SortableContext id={status} items={columns[status].map(i => i.id)} strategy={verticalListSortingStrategy}>
                     <div className="min-h-[100px] space-y-3">
                       <AnimatePresence mode="popLayout">
                         {columns[status].map((item) => (
                           <SortableItem key={item.id} id={item.id}>
                             {({ attributes, listeners }) => (
                             <motion.div
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="group relative bg-white border border-border/40 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/10 transition-all cursor-default"
                             >
                               <div className="flex flex-col gap-3">
                                  <div className="flex items-start justify-between">
                                     <div /> {/* Spacer if needed */}
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100">
                                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                           </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-border/30">
                                           {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                              status !== k && (
                                                 <DropdownMenuItem key={k} onClick={() => updateItem.mutate({ id: item.id, status: k as any })} className="rounded-xl font-bold text-xs">
                                                    Déplacer vers {v.label}
                                                 </DropdownMenuItem>
                                              )
                                           ))}
                                           <DropdownMenuItem 
                                              onClick={() => deleteItem.mutate(item.id)}
                                              className="text-destructive font-bold text-xs rounded-xl"
                                           >
                                              Supprimer
                                           </DropdownMenuItem>
                                        </DropdownMenuContent>
                                     </DropdownMenu>
                                  </div>

                                  <EditableInput
                                    initialValue={item.title}
                                    onSave={(val) => updateItem.mutate({ id: item.id, title: val })}
                                    className="text-[15px] font-bold border-none shadow-none p-0 focus-visible:ring-0 bg-transparent h-auto leading-tight"
                                  />
                                  
                                  <div className="flex items-center justify-between pt-1">
                                     <div className="flex -space-x-1">
                                        <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100" />
                                     </div>
                                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          className="cursor-grab active:cursor-grabbing rounded-md p-1 text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground transition-colors"
                                          aria-label="Déplacer la tâche"
                                          {...attributes}
                                          {...listeners}
                                        >
                                          <GripHorizontal className="h-4 w-4" />
                                        </button>
                                     </div>
                                  </div>
                               </div>
                             </motion.div>
                             )}
                           </SortableItem>
                         ))}
                       </AnimatePresence>
                     </div>
                  </SortableContext>
                  
                  {columns[status].length === 0 && !quickAddTitles[status] && (
                    <div className="py-20 text-center space-y-2 opacity-20">
                       <div className="p-4 rounded-2xl bg-muted/20 w-16 h-16 flex items-center justify-center mx-auto mb-2">
                         <ListTodo className="h-8 w-8 text-muted-foreground/50" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vide</p>
                    </div>
                  )}
                </DroppableColumn>
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? (
              <div className="group relative bg-white border border-primary/20 p-5 rounded-2xl shadow-2xl scale-105 cursor-grabbing">
                 <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div />
                  </div>
                    <div className="text-[15px] font-bold leading-tight">{activeItem.title}</div>
                    <div className="flex items-center justify-between pt-1">
                       <div className="flex -space-x-1">
                          <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100" />
                       </div>
                       <GripHorizontal className="h-4 w-4 text-primary/40" />
                    </div>
                 </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </PremiumAccessGate>
    </div>
  );
}
