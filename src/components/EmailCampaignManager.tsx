import { useState } from "react";
import { Send, Clock, Play, Users, Mail, Loader2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { useMembers } from "@/hooks/useMembers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const EmailCampaignManager = () => {
  const { templates } = useEmailTemplates();
  const { members } = useMembers();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    templateId: "",
    subject: "",
    content: "",
    recipientType: "all", // all, birthday, custom
  });

  const birthdayTemplate = templates.find((t) => t.type === "birthday");
  const monthlyTemplate = templates.find((t) => t.type === "monthly");

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        subject: template.subject,
        content: template.content,
      });
    }
  };

  const handleSendNow = async () => {
    if (!formData.subject || !formData.content) {
      toast({ title: "Please fill in subject and content", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const recipients = members.map((m) => ({ name: m.full_name, email: m.email }));
      
      const { error } = await supabase.functions.invoke("send-campaign-emails", {
        body: {
          subject: formData.subject,
          content: formData.content,
          recipients,
        },
      });

      if (error) throw error;

      toast({ title: "Campaign sent", description: `Emails sent to ${recipients.length} members` });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const quickActions = [
    {
      title: "Send to All Members",
      description: "Send an email to all registered members",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      action: () => {
        setFormData({ templateId: "", subject: "", content: "", recipientType: "all" });
        setIsDialogOpen(true);
      },
    },
    {
      title: "Birthday Greetings",
      description: "Automatic birthday emails to members",
      icon: CalendarPlus,
      color: "bg-pink-50 text-pink-600",
      action: () => {
        if (birthdayTemplate) {
          setFormData({
            templateId: birthdayTemplate.id,
            subject: birthdayTemplate.subject,
            content: birthdayTemplate.content,
            recipientType: "birthday",
          });
        }
        setIsDialogOpen(true);
      },
    },
    {
      title: "Monthly Newsletter",
      description: "Send monthly updates to all members",
      icon: Mail,
      color: "bg-green-50 text-green-600",
      action: () => {
        if (monthlyTemplate) {
          setFormData({
            templateId: monthlyTemplate.id,
            subject: monthlyTemplate.subject.replace("{{month}}", new Date().toLocaleString("default", { month: "long" })),
            content: monthlyTemplate.content.replace("{{month}}", new Date().toLocaleString("default", { month: "long" })),
            recipientType: "all",
          });
        }
        setIsDialogOpen(true);
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Campaigns</h2>
        <p className="text-muted-foreground">Send emails without creating documents</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={action.action}
          >
            <CardHeader>
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                <action.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-sm text-muted-foreground">Templates</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{members.filter((m) => m.birthday).length}</p>
              <p className="text-sm text-muted-foreground">With Birthday</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-sm text-muted-foreground">Auto Birthdays</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email Campaign</DialogTitle>
            <DialogDescription>
              Compose and send emails to your members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Use Template (optional)</Label>
              <Select value={formData.templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your email message..."
                rows={10}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <strong>Recipients:</strong> {members.length} members
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNow} disabled={isSending || !formData.subject || !formData.content}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
