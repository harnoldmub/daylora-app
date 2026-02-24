import { useParams } from "wouter";
import { useWedding } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";

export default function CustomPage() {
  const _params = useParams();
  const slug = (_params as any).slug || (_params as any).weddingId || "";
  const customSlug = (_params as any).customSlug || "";
  const { data: wedding, isLoading } = useWedding(slug);

  if (isLoading) {
    return <div className="min-h-[50vh] animate-pulse bg-muted/30 rounded-xl" />;
  }

  const page = wedding?.config?.navigation?.customPages?.find(
    (item) => item.slug === customSlug && item.enabled
  );

  if (!page) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Page introuvable</p>
      </div>
    );
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-6">{page.title}</h1>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{page.content}</div>
        </Card>
      </div>
    </section>
  );
}
