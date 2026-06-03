import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import ShareLinkPanel from "@/components/applications/ShareLinkPanel";
import { useAuth } from "@/hooks/useAuth";
import { AccessDenied } from "@/components/RouteAccess";
import { toast } from "@/hooks/use-toast";

const AdminFormsPage = () => {
  const { isAdmin, isCED, isExecutiveSecretary } = useAuth();
  const allowed = isAdmin || isCED || isExecutiveSecretary;
  const [forms, setForms] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const load = async () => {
    const [{ data: f }, { data: l }] = await Promise.all([
      supabase.from("form_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("application_links").select("*").order("created_at", { ascending: false }),
    ]);
    setForms(f || []); setLinks(l || []);
  };
  useEffect(() => { if (allowed) load(); }, [allowed]);

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("form_templates").update({ is_active }).eq("id", id);
    toast({ title: is_active ? "Form activated" : "Form deactivated" });
    load();
  };

  if (!allowed) return <AccessDenied />;
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-display text-3xl font-semibold mb-2">Admin Forms & Links</h1>
        <p className="text-muted-foreground mb-6">Manage every faction's form template and registration campaign.</p>
        <ShareLinkPanel />
        <h2 className="font-display text-xl font-semibold mt-8 mb-3">Templates</h2>
        <div className="space-y-2">
          {forms.map(f => (
            <Card key={f.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{f.form_name}</p>
                <p className="text-xs text-muted-foreground">{f.faction || "all"} · {f.form_type}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{f.is_active ? "Active" : "Inactive"}</Badge>
                <Switch checked={!!f.is_active} onCheckedChange={(v)=>toggle(f.id, v)} />
              </div>
            </Card>
          ))}
        </div>
        <h2 className="font-display text-xl font-semibold mt-8 mb-3">Campaign links</h2>
        <div className="space-y-2">
          {links.map(l => (
            <Card key={l.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-mono text-sm">{l.ref_campaign || l.link_slug || "(default)"}</p>
                <p className="text-xs text-muted-foreground">{l.target_url}</p>
              </div>
              <Badge variant="outline">{l.application_count} apps</Badge>
            </Card>
          ))}
          {links.length === 0 && <p className="text-muted-foreground text-sm">No campaigns yet.</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminFormsPage;