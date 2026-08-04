import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AccessDenied, PageLoader } from "@/components/RouteAccess";
import {
  DESIGN_SYSTEMS,
  DesignSystemId,
  PageStyleRow,
  usePageStyles,
} from "@/design/pageStyles";

export default function StyleDashboard() {
  const { role, rolesLoading, authReady } = useAuth() as any;
  const { data, isLoading } = usePageStyles();
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async ({ id, design_system }: { id: string; design_system: DesignSystemId }) => {
      const { error } = await supabase
        .from("page_styles")
        .update({ design_system } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-styles"] });
      toast.success("Design system updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
    onSettled: () => setSaving(null),
  });

  if (!authReady || rolesLoading) return <PageLoader />;
  if (!["admin", "super_admin"].includes(role))
    return <AccessDenied title="Style Dashboard" message="Only administrators can manage page design systems." />;

  const rows = (data ?? []) as PageStyleRow[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground">Page Design Systems</h1>
        <p className="text-muted-foreground mt-2">
          Assign a design system to each page. Changes apply immediately across the site.
        </p>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

        <div className="mt-8 space-y-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  {row.label}
                  <Badge variant="outline" className="font-mono text-xs">{row.route}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {DESIGN_SYSTEMS.map((ds) => {
                  const active = row.design_system === ds.id;
                  return (
                    <Button
                      key={ds.id}
                      variant={active ? "default" : "outline"}
                      disabled={saving === row.id}
                      onClick={() => {
                        setSaving(row.id);
                        update.mutate({ id: row.id, design_system: ds.id });
                      }}
                      className="h-auto flex-col items-start gap-1 py-3 text-left"
                    >
                      <span className="font-semibold">{ds.name}</span>
                      <span className="text-xs opacity-70">{ds.description}</span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}