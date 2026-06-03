import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ShareLinkPanel from "@/components/applications/ShareLinkPanel";
import { useAuth } from "@/hooks/useAuth";
import { AccessDenied } from "@/components/RouteAccess";
import { Pencil, FileText } from "lucide-react";

const FactionFormsPage = () => {
  const { isAdmin, isCED, isExecutiveSecretary, isCommunityManager, isED, isEA } = useAuth();
  const allowed = isAdmin || isCED || isExecutiveSecretary || isCommunityManager || isED || isEA;
  const [forms, setForms] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("form_templates").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setForms(data || []));
  }, []);
  if (!allowed) return <AccessDenied />;
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-display text-3xl font-semibold mb-2">Faction Forms</h1>
        <p className="text-muted-foreground mb-6">Review the membership form templates for each faction and share registration links.</p>
        <ShareLinkPanel />
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {forms.map(f => (
            <Card key={f.id} className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{f.form_type}</p>
                  <h3 className="font-display text-lg font-semibold">{f.form_name}</h3>
                </div>
                <Badge variant="outline">{f.faction || "all"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{f.form_description}</p>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span><FileText className="inline w-3 h-3 mr-1"/>{(f.sections?.length || 0)} sections</span>
                <Button size="sm" variant="ghost" disabled><Pencil className="w-3 h-3 mr-1"/>Edit</Button>
              </div>
            </Card>
          ))}
          {forms.length === 0 && <p className="text-muted-foreground text-sm">No form templates yet.</p>}
        </div>
      </main>
    </div>
  );
};

export default FactionFormsPage;