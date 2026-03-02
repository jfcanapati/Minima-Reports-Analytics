"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectSeparator, SelectGroup } from "@/components/ui/Select";
import { Users, UserPlus, Pencil, Ban, CheckCircle, Loader2, Search, Eye, EyeOff, Filter } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { APP_ROLES, AppRole } from "@/lib/constants";
import { useToast } from "@/hooks/useToast";

export default function UsersPage() {
  const { users, loading, addUser, updateUser, toggleUserStatus } = useUsers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: APP_ROLES.ADMIN as AppRole,
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      phone: "",
      role: APP_ROLES.ADMIN,
    });
    setShowPassword(false);
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const result = await addUser(formData.email, formData.password, formData.name, formData.role, formData.phone);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Success", description: "User added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: result.error || "Failed to add user", variant: "destructive" });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    const result = await updateUser(selectedUser.id, {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Success", description: "User updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } else {
      toast({ title: "Error", description: result.error || "Failed to update user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    const result = await toggleUserStatus(selectedUser.id, selectedUser.status || "active");
    setIsSubmitting(false);

    if (result.success) {
      const newStatus = selectedUser.status === "active" ? "inactive" : "active";
      toast({ 
        title: "Success", 
        description: `User ${newStatus === "active" ? "activated" : "deactivated"} successfully` 
      });
      setIsStatusDialogOpen(false);
      setSelectedUser(null);
    } else {
      toast({ title: "Error", description: result.error || "Failed to update user status", variant: "destructive" });
    }
  };

  const openStatusDialog = (user: any) => {
    setSelectedUser(user);
    setIsStatusDialogOpen(true);
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name || "",
      phone: user.phone || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    // Status filter
    const matchesStatus = statusFilter === "all" || (user.status || "active") === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case APP_ROLES.ADMIN:
        return "default";
      case APP_ROLES.MANAGER:
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "success" : "outline";
  };

  const formatRole = (role: string) => {
    return role
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <PageContainer title="User Management" subtitle="Manage system users and their roles">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-medium text-black">All Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredUsers.length === users.length 
              ? `${users.length} total users`
              : `${filteredUsers.length} of ${users.length} users`
            }
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account with email and password</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                  {/* Left Column - User Details */}
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="add-email">Email *</Label>
                      <Input
                        id="add-email"
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="add-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="add-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="add-name">Name *</Label>
                      <Input
                        id="add-name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="add-phone">Phone</Label>
                      <Input
                        id="add-phone"
                        placeholder="+1234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Right Column - Role Selection */}
                  <div className="grid gap-2">
                    <Label>Role *</Label>
                    <div className="border border-gray-200 rounded-md p-4 space-y-3 max-h-[400px] overflow-y-auto">
                      {/* Booking */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">Booking</div>
                        <div className="space-y-2 ml-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.CLIENT}
                              checked={formData.role === APP_ROLES.CLIENT}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Client</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.RECEPTIONIST}
                              checked={formData.role === APP_ROLES.RECEPTIONIST}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Receptionist</span>
                          </label>
                        </div>
                      </div>

                      {/* Point of Sale */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Point of Sale</div>
                        <div className="space-y-2 ml-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.RECEPTIONIST}
                              checked={formData.role === APP_ROLES.RECEPTIONIST}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Receptionist</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.MANAGER}
                              checked={formData.role === APP_ROLES.MANAGER}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Manager</span>
                          </label>
                        </div>
                      </div>

                      {/* Inventory */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Inventory</div>
                        <div className="space-y-2 ml-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.INVENTORY_CONTROLLER}
                              checked={formData.role === APP_ROLES.INVENTORY_CONTROLLER}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Inventory Controller</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.KITCHEN_STAFF}
                              checked={formData.role === APP_ROLES.KITCHEN_STAFF}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Kitchen Staff</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.PURCHASING_OFFICER}
                              checked={formData.role === APP_ROLES.PURCHASING_OFFICER}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Purchasing Officer</span>
                          </label>
                        </div>
                      </div>

                      {/* Reports */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Reports</div>
                        <div className="space-y-2 ml-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="role"
                              value={APP_ROLES.ADMIN}
                              checked={formData.role === APP_ROLES.ADMIN}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Admin</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none h-10 w-40"
          >
            <option value="all">All Roles</option>
            {Object.values(APP_ROLES).map((role) => (
              <option key={role} value={role}>
                {formatRole(role)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none h-10 w-32"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="w-10">
            {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="h-10 w-10"
                title="Clear all filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">
              {searchQuery ? "No users found matching your search" : "No users yet"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-300 bg-gray-100/50">
                <TableHead className="text-xs font-medium text-gray-500">Name</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Email</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Phone</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Role</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Created</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-gray-300 transition-colors duration-200 hover:bg-gray-100/30">
                  <TableCell className="py-4">
                    <span className="text-sm font-medium text-black">{user.name || "—"}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600">{user.phone || "—"}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="font-normal">
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={getStatusBadgeVariant(user.status || "active")} className="font-normal capitalize">
                      {user.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(user)}
                        className="h-8 px-2 hover:bg-gray-100"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        <span className="text-xs">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openStatusDialog(user)}
                        className={`h-8 px-2 ${
                          user.status === "active" 
                            ? "hover:bg-red-50 hover:text-red-600" 
                            : "hover:bg-green-50 hover:text-green-600"
                        }`}
                      >
                        {user.status === "active" ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            <span className="text-xs">Deactivate</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Activate</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left Column - User Details */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" value={formData.email} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Right Column - Role Selection */}
            <div className="grid gap-2">
              <Label>Role</Label>
              <div className="border border-gray-200 rounded-md p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Booking */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Booking</div>
                  <div className="space-y-2 ml-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.CLIENT}
                        checked={formData.role === APP_ROLES.CLIENT}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Client</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.RECEPTIONIST}
                        checked={formData.role === APP_ROLES.RECEPTIONIST}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Receptionist</span>
                    </label>
                  </div>
                </div>

                {/* Point of Sale */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Point of Sale</div>
                  <div className="space-y-2 ml-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.RECEPTIONIST}
                        checked={formData.role === APP_ROLES.RECEPTIONIST}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Receptionist</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.MANAGER}
                        checked={formData.role === APP_ROLES.MANAGER}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Manager</span>
                    </label>
                  </div>
                </div>

                {/* Inventory */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Inventory</div>
                  <div className="space-y-2 ml-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.INVENTORY_CONTROLLER}
                        checked={formData.role === APP_ROLES.INVENTORY_CONTROLLER}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Inventory Controller</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.KITCHEN_STAFF}
                        checked={formData.role === APP_ROLES.KITCHEN_STAFF}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Kitchen Staff</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.PURCHASING_OFFICER}
                        checked={formData.role === APP_ROLES.PURCHASING_OFFICER}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Purchasing Officer</span>
                    </label>
                  </div>
                </div>

                {/* Reports */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Reports</div>
                  <div className="space-y-2 ml-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-role"
                        value={APP_ROLES.ADMIN}
                        checked={formData.role === APP_ROLES.ADMIN}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Admin</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Confirmation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === "active" ? "Deactivate User" : "Activate User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.status === "active" ? (
                <>
                  Are you sure you want to deactivate <strong>{selectedUser?.name || selectedUser?.email}</strong>? 
                  They will not be able to access the system until reactivated.
                </>
              ) : (
                <>
                  Are you sure you want to activate <strong>{selectedUser?.name || selectedUser?.email}</strong>? 
                  They will be able to access the system again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant={selectedUser?.status === "active" ? "destructive" : "default"}
              onClick={handleDeleteUser} 
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {selectedUser?.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
