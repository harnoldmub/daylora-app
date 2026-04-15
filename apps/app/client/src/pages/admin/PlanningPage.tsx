import { Redirect, useParams } from "wouter";

export default function PlanningPage() {
  const params = useParams<{ weddingId?: string }>();
  const weddingId = params.weddingId || "";

  if (weddingId) {
    return <Redirect to={`/${weddingId}/checklist?view=planning`} />;
  }

  return <Redirect to="/checklist?view=planning" />;
}
