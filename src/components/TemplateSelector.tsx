import { useState } from "react";
import { FileText, Plus, Edit, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplates, LetterTemplate } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface TemplateSelectorProps {
  onSelectTemplate: (content: string) => void;
  currentContent: string;
}

const TemplateSelector = ({ onSelectTemplate, currentContent }: TemplateSelectorProps) => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { isAdmin } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LetterTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", content: "" });

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.content) return;
    
    await createTemplate.mutateAsync(newTemplate);
    setNewTemplate({ name: "", description: "", content: "" });
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;
    
    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      name: editingTemplate.name,
      description: editingTemplate.description || undefined,
      content: editingTemplate.content,
    });
    setEditingTemplate(null);
    setIsEditOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    await deleteTemplate.mutateAsync(id);
  };

  const handleSaveCurrentAsTemplate = () => {
    setNewTemplate({ name: "", description: "", content: currentContent });
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select onValueChange={(value) => {
          const template = templates.find(t => t.id === value);
          if (template) onSelectTemplate(template.content);
        }}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {template.name}
                  {template.is_default && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Save as template">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Save this letter content as a reusable template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    placeholder="e.g., Volunteer Engagement Letter"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of this template"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    rows={10}
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? "Saving..." : "Save Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isAdmin && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSaveCurrentAsTemplate}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Save current content as template
        </Button>
      )}

      {isAdmin && templates.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Manage Templates (Admin)</p>
          <div className="space-y-2">
            {templates.filter(t => !t.is_default).map((template) => (
              <div key={template.id} className="flex items-center justify-between text-sm p-2 bg-accent/30 rounded">
                <span className="truncate">{template.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  rows={10}
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateSelector;
