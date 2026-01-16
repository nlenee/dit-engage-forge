import { useState } from "react";
import { Plus, Search, Edit, Trash2, Cake, Mail, Phone, Loader2, Send, UserPlus, Lock, Unlock, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMembers, Member } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { getCountryName, getStateName } from "@/data/countries";

const FACTIONS = ["DYP", "TECK", "SHI", "MINDUP"];

export const MemberManagement = () => {
  const { members, isLoading, createMember, updateMember, deleteMember, getTodaysBirthdays, getUpcomingBirthdays } = useMembers();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    birthday: "",
    country: "",
    state: "",
    faction: "",
    role_in_dit: "",
    bio: "",
    joined_dit_date: "",
    locked_by_admin: false,
  });

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todaysBirthdays = getTodaysBirthdays();
  const upcomingBirthdays = getUpcomingBirthdays(7);

  const handleOpenDialog = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        full_name: member.full_name,
        email: member.email,
        phone: member.phone || "",
        birthday: member.birthday || "",
        country: (member as any).country || "",
        state: (member as any).state || "",
        faction: (member as any).faction || "",
        role_in_dit: (member as any).role_in_dit || "",
        bio: (member as any).bio || "",
        joined_dit_date: (member as any).joined_dit_date || "",
        locked_by_admin: (member as any).locked_by_admin || false,
      });
    } else {
      setEditingMember(null);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        birthday: "",
        country: "",
        state: "",
        faction: "",
        role_in_dit: "",
        bio: "",
        joined_dit_date: "",
        locked_by_admin: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingMember) {
      await updateMember.mutateAsync({ id: editingMember.id, ...formData });
    } else {
      await createMember.mutateAsync(formData as any);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMember.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleLock = async (member: Member) => {
    const currentLocked = (member as any).locked_by_admin || false;
    try {
      const { error } = await supabase
        .from("members")
        .update({ locked_by_admin: !currentLocked })
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: currentLocked ? "Profile Unlocked" : "Profile Locked",
        description: `${member.full_name}'s profile is now ${currentLocked ? "editable" : "locked"}.`,
      });

      // Refresh members
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateYearsInDIT = (joinedDate: string | null) => {
    if (!joinedDate) return null;
    const joined = new Date(joinedDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return years;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Birthday Alerts */}
      {todaysBirthdays.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cake className="h-5 w-5 text-yellow-600" />
              Today's Birthdays 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {todaysBirthdays.map((m) => (
                <Badge key={m.id} variant="secondary" className="bg-yellow-100">
                  {m.full_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingBirthdays.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cake className="h-5 w-5 text-blue-600" />
              Upcoming Birthdays (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {upcomingBirthdays.map((m) => (
                <Badge key={m.id} variant="secondary" className="bg-blue-100">
                  {m.full_name} - {m.birthday && format(new Date(m.birthday), "MMM d")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manually
          </Button>
          <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Send Invite
          </Button>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send a registration invitation link to a new member's email. They will complete registration with email OTP verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite_email">Email Address *</Label>
              <Input
                id="invite_email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setIsSendingInvite(true);
                try {
                  const { error } = await supabase.functions.invoke("send-member-invitation", {
                    body: { email: inviteEmail },
                  });
                  if (error) throw error;
                  toast({ title: "Invitation Sent", description: `Registration link sent to ${inviteEmail}` });
                  setIsInviteDialogOpen(false);
                  setInviteEmail("");
                } catch (err: any) {
                  toast({ title: "Failed to Send", description: err.message, variant: "destructive" });
                } finally {
                  setIsSendingInvite(false);
                }
              }}
              disabled={!inviteEmail || isSendingInvite}
            >
              {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Faction</TableHead>
                <TableHead>Role in DIT</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const memberData = member as any;
                  const yearsInDIT = calculateYearsInDIT(memberData.joined_dit_date);
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {member.full_name}
                          {memberData.locked_by_admin && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{member.email}</span>
                          {memberData.email_verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {memberData.faction && (
                          <Badge variant="secondary">{memberData.faction}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm">{memberData.role_in_dit || "—"}</span>
                          {yearsInDIT !== null && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({yearsInDIT}y)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(memberData.country || memberData.state) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {memberData.state && getStateName(memberData.country, memberData.state)}
                            {memberData.state && memberData.country && ", "}
                            {memberData.country && getCountryName(memberData.country)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.birthday && (
                          <div className="flex items-center gap-1">
                            <Cake className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(member.birthday), "MMM d, yyyy")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {memberData.registered_at ? (
                          <Badge className="bg-green-100 text-green-700">Registered</Badge>
                        ) : memberData.invitation_sent_at ? (
                          <Badge className="bg-yellow-100 text-yellow-700">Invited</Badge>
                        ) : (
                          <Badge variant="secondary">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setViewingMember(member);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isSuperAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleLock(member)}
                              title={memberData.locked_by_admin ? "Unlock Profile" : "Lock Profile"}
                            >
                              {memberData.locked_by_admin ? (
                                <Unlock className="h-4 w-4 text-green-600" />
                              ) : (
                                <Lock className="h-4 w-4 text-yellow-600" />
                              )}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                  {viewingMember.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{viewingMember.full_name}</h3>
                  <p className="text-muted-foreground">{(viewingMember as any).role_in_dit || "Member"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm">{viewingMember.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm">{viewingMember.phone || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Faction</Label>
                  <p className="text-sm">{(viewingMember as any).faction || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Years in DIT</Label>
                  <p className="text-sm">
                    {calculateYearsInDIT((viewingMember as any).joined_dit_date) ?? "—"} years
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Birthday</Label>
                  <p className="text-sm">
                    {viewingMember.birthday ? format(new Date(viewingMember.birthday), "MMMM d, yyyy") : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm">
                    {(viewingMember as any).state && getStateName((viewingMember as any).country, (viewingMember as any).state)}
                    {(viewingMember as any).state && (viewingMember as any).country && ", "}
                    {(viewingMember as any).country && getCountryName((viewingMember as any).country)}
                    {!(viewingMember as any).country && !(viewingMember as any).state && "—"}
                  </p>
                </div>
              </div>

              {(viewingMember as any).bio && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <p className="text-sm bg-muted p-2 rounded">{(viewingMember as any).bio}</p>
                </div>
              )}

              {(viewingMember as any).testimony && (
                <div>
                  <Label className="text-xs text-muted-foreground">Testimony</Label>
                  <p className="text-sm bg-muted p-2 rounded">{(viewingMember as any).testimony}</p>
                </div>
              )}

              {(viewingMember as any).previous_roles?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Previous Roles</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(viewingMember as any).previous_roles.map((role: string, i: number) => (
                      <Badge key={i} variant="outline">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
            <DialogDescription>
              {editingMember ? "Update member information" : "Register a new member to the platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faction">Faction</Label>
                <Select
                  value={formData.faction}
                  onValueChange={(value) => setFormData({ ...formData, faction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faction" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACTIONS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joined_dit_date">Joined DIT</Label>
                <Input
                  id="joined_dit_date"
                  type="date"
                  value={formData.joined_dit_date}
                  onChange={(e) => setFormData({ ...formData, joined_dit_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_in_dit">Role in DIT</Label>
              <Input
                id="role_in_dit"
                value={formData.role_in_dit}
                onChange={(e) => setFormData({ ...formData, role_in_dit: e.target.value })}
                placeholder="e.g. Team Lead, Developer, Designer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (max 50 chars)</Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 50) })}
                placeholder="Short bio..."
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">{formData.bio.length}/50</p>
            </div>

            {isSuperAdmin && editingMember && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="locked">Lock Profile</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent member from editing their birthday and role
                  </p>
                </div>
                <Switch
                  id="locked"
                  checked={formData.locked_by_admin}
                  onCheckedChange={(checked) => setFormData({ ...formData, locked_by_admin: checked })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.full_name || !formData.email || createMember.isPending || updateMember.isPending}
            >
              {createMember.isPending || updateMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingMember ? "Update" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this member? This action cannot be undone.
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
