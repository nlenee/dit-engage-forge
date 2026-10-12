import { useState } from "react";
import { Plus, Edit, Trash2, FileText, Cake, Calendar, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";

export const EmailTemplateManager = () => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useEmailTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateType, setTemplateType] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    type: "custom",
    description: "",
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "birthday":
        return <Cake className="h-4 w-4" />;
      case "monthly":
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "birthday":
        return "bg-pink-100 text-pink-700";
      case "monthly":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        type: template.type,
        description: template.description || "",
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: "", subject: "", content: "", type: "custom", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...formData });
    } else {
      await createTemplate.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTemplate.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const term = templateSearch.trim().toLowerCase();
    return (templateType === "all" || template.type === templateType) &&
      (!term || [template.name, template.subject, template.description].some(value => String(value || "").toLowerCase().includes(term)));
  });
  const availableTypes = Array.from(new Set(templates.map(template => template.type))).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Create and manage email templates for different purposes</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <strong>Available placeholders:</strong> {"{{name}}"} - Recipient name, {"{{month}}"} - Current month, {"{{year}}"} - Current year
      </div>

      <section aria-label="Template library filters" className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[{label:"Total templates",value:templates.length},{label:"Available types",value:availableTypes.length},{label:"Matching templates",value:filteredTemplates.length}].map(metric=>
            <div key={metric.label} className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="text-xl font-semibold tabular-nums">{metric.value}</p></div>)}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/>
            <Input className="pl-9" aria-label="Search email templates" placeholder="Search name, subject or description…" value={templateSearch} onChange={e=>setTemplateSearch(e.target.value)}/>
          </div>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger aria-label="Filter templates by type" className="w-full sm:w-44"><SelectValue placeholder="All types"/></SelectTrigger>
            <SelectContent><SelectItem value="all">All types</SelectItem>{availableTypes.map(type=><SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">{filteredTemplates.length} of {templates.length} templates</p>
      </section>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{templates.length ? "No templates match your filters." : "No templates yet. Create your first template."}</p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="group min-w-0 hover:shadow-md transition-shadow">
              <CardHeader className="p-3 sm:p-5 pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.type)}
                    <CardTitle className="text-sm sm:text-base break-words">{template.name}</CardTitle>
                  </div>
                  <Badge className={getTypeBadgeColor(template.type)}>{template.type}</Badge>
                </div>
                <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0">
                <details className="mb-3 rounded-lg border p-2">
                  <summary className="cursor-pointer text-xs font-medium text-primary">Preview template</summary>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">{template.content}</p>
                </details>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(template.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Modify your email template" : "Create a reusable email template"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Welcome to DIT, {{name}}!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Email Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your email content here... Use {{name}} for personalization."
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this template"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name || !formData.subject || !formData.content ||
                createTemplate.isPending || updateTemplate.isPending
              }
            >
              {createTemplate.isPending || updateTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
