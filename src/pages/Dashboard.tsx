import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Download,
  Mail,
  Search,
  Filter,
  Calendar,
  MapPin,
  Briefcase,
  MoreVertical,
  Trash2,
  Eye,
  Edit,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import { useLetters } from "@/hooks/useLetters";
import { getCountryName, getStateName } from "@/data/countries";
import ditLogo from "@/assets/dit-logo.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const { letters, isLoading, deleteLetter } = useLetters();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredLetters = letters.filter(
    (letter) =>
      letter.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.office?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteId) {
      await deleteLetter.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const stats = {
    total: letters.length,
    sent: letters.filter((l) => l.status === "sent").length,
    downloaded: letters.filter((l) => l.status === "downloaded").length,
    drafts: letters.filter((l) => l.status === "draft").length,
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-700 border-green-200";
      case "downloaded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "draft":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="dit-gradient-hero rounded-2xl p-8 mb-8 relative overflow-hidden animate-fade-in">
          <div className="absolute top-4 right-4 opacity-10">
            <img src={ditLogo} alt="" className="h-32 w-32 object-contain" />
          </div>
          
          <div className="relative z-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
              Letter of Engagement Generator
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">
              Create, manage, and distribute official DIT Letters of Engagement with professional
              styling and digital signatures.
            </p>
            
            <Link to="/create">
              <Button className="bg-primary hover:bg-primary/90 shadow-soft">
                <Plus className="h-4 w-4 mr-2" />
                Create New Letter
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Letters", value: stats.total, icon: FileText, color: "text-dit-navy" },
            { label: "Downloaded", value: stats.downloaded, icon: Download, color: "text-blue-600" },
            { label: "Sent", value: stats.sent, icon: Mail, color: "text-green-600" },
            { label: "Drafts", value: stats.drafts, icon: FileText, color: "text-yellow-600" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-5 shadow-soft border border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search letters by name, office, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Letters List */}
        <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Recent Letters
          </h2>

          {isLoading ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border/50 shadow-soft">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading letters...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center border border-border/50 shadow-soft">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                No letters yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first Letter of Engagement to get started.
              </p>
              <Link to="/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Letter
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredLetters.map((letter, index) => (
                <div
                  key={letter.id}
                  className="bg-card rounded-xl p-5 border border-border/50 shadow-soft hover:shadow-card transition-shadow animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {letter.recipient_name}
                        </h3>
                        <Badge className={getStatusColor(letter.status)}>
                          {letter.status || "draft"}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {letter.office}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {letter.state && `${getStateName(letter.country, letter.state)}, `}
                          {getCountryName(letter.country)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(letter.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => navigate(`/edit/${letter.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => navigate(`/edit/${letter.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive"
                            onClick={() => setDeleteId(letter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Letter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this letter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
