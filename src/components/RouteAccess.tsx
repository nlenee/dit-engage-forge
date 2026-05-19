import { Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

export const PageLoader = ({ message = "Restoring secure session…" }: { message?: string }) => (
  <div className="min-h-screen bg-background">
    <Header />
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const AccessDenied = ({
  title = "Access restricted",
  description = "Your account does not currently have permission to view this workspace.",
}: {
  title?: string;
  description?: string;
}) => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Return to dashboard</Link>
        </Button>
      </section>
    </main>
  </div>
);