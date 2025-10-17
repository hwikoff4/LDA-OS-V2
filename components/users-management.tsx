"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  Building2,
  Users as UsersIcon,
  AlertCircle,
  Check,
  X,
  Edit,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: string
  email: string
  full_name: string
  role: "owner" | "admin" | "company_owner" | "employee"
  company_id: string | null
  status: "active" | "inactive" | "suspended"
  created_at: string
}

interface Company {
  id: string
  name: string
  status: string
}

interface Permission {
  key: string
  name: string
  description: string
  category: string
}

export function UsersManagement() {
  const { profile, hasRole } = useAuth()
  const supabase = createClient()

  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "employee" as const,
    company_id: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: usersData } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: companiesData } = await supabase
      .from("companies")
      .select("*")
      .order("name")

    const { data: permsData } = await supabase
      .from("permission_definitions")
      .select("*")
      .order("category, name")

    if (usersData) setUsers(usersData as User[])
    if (companiesData) setCompanies(companiesData as Company[])
    if (permsData) setPermissions(permsData as Permission[])

    setLoading(false)
  }

  const handleCreateUser = async () => {
    setError(null)
    setSuccess(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            role: newUser.role,
            company_id: newUser.company_id || null,
            created_by: profile?.id,
          })
          .eq("id", data.user.id)

        if (profileError) throw profileError

        setSuccess("User created successfully!")
        setCreateDialogOpen(false)
        setNewUser({
          email: "",
          full_name: "",
          password: "",
          role: "employee",
          company_id: "",
        })
        fetchData()
      }
    } catch (err: any) {
      setError(err.message || "Failed to create user")
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: selectedUser.full_name,
          role: selectedUser.role,
          company_id: selectedUser.company_id,
          status: selectedUser.status,
        })
        .eq("id", selectedUser.id)

      if (error) throw error

      setSuccess("User updated successfully!")
      setEditDialogOpen(false)
      setSelectedUser(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || "Failed to update user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId)

      if (error) throw error

      setSuccess("User deleted successfully!")
      fetchData()
    } catch (err: any) {
      setError(err.message || "Failed to delete user")
    }
  }

  const openPermissionsDialog = async (user: User) => {
    setSelectedUser(user)

    const { data } = await supabase
      .from("user_permissions")
      .select("permission_key")
      .eq("user_id", user.id)

    setUserPermissions(data?.map((p) => p.permission_key) || [])
    setPermissionsDialogOpen(true)
  }

  const handleTogglePermission = async (permissionKey: string) => {
    if (!selectedUser) return

    const hasPermission = userPermissions.includes(permissionKey)

    if (hasPermission) {
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", selectedUser.id)
        .eq("permission_key", permissionKey)

      setUserPermissions(userPermissions.filter((p) => p !== permissionKey))
    } else {
      await supabase
        .from("user_permissions")
        .insert({
          user_id: selectedUser.id,
          permission_key: permissionKey,
          granted_by: profile?.id,
        })

      setUserPermissions([...userPermissions, permissionKey])
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canManageUsers = hasRole("owner", "admin", "company_owner")
  const canCreateAdmin = hasRole("owner")
  const canSeeAllUsers = hasRole("owner", "admin")

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-600">Owner</Badge>
      case "admin":
        return <Badge className="bg-blue-600">Admin</Badge>
      case "company_owner":
        return <Badge className="bg-green-600">Company Owner</Badge>
      default:
        return <Badge variant="secondary">Employee</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>
      case "suspended":
        return <Badge className="bg-red-600">Suspended</Badge>
      default:
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  if (!canManageUsers) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You don't have permission to manage users.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-600 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users, roles, and permissions for your organization
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to your organization</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {canCreateAdmin && <SelectItem value="admin">Admin</SelectItem>}
                        {canSeeAllUsers && <SelectItem value="company_owner">Company Owner</SelectItem>}
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newUser.role === "company_owner" || newUser.role === "employee") && (
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Select
                        value={newUser.company_id}
                        onValueChange={(value) => setNewUser({ ...newUser, company_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} className="bg-red-600 hover:bg-red-700">
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or role..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.company_id ? (
                          <span className="text-sm">
                            {companies.find((c) => c.id === user.company_id)?.name || "Unknown"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No company</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                            {user.role !== "owner" && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={selectedUser.full_name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: any) =>
                    setSelectedUser({ ...selectedUser, role: value })
                  }
                  disabled={selectedUser.role === "owner"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {canCreateAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    {canSeeAllUsers && <SelectItem value="company_owner">Company Owner</SelectItem>}
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value: any) =>
                    setSelectedUser({ ...selectedUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="bg-red-600 hover:bg-red-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              {selectedUser && `Configure permissions for ${selectedUser.full_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(
              permissions.reduce((acc, perm) => {
                if (!acc[perm.category]) acc[perm.category] = []
                acc[perm.category].push(perm)
                return acc
              }, {} as Record<string, Permission[]>)
            ).map(([category, perms]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold capitalize">{category}</h4>
                <div className="space-y-2">
                  {perms.map((perm) => (
                    <div key={perm.key} className="flex items-start space-x-3">
                      <Checkbox
                        checked={userPermissions.includes(perm.key)}
                        onCheckedChange={() => handleTogglePermission(perm.key)}
                      />
                      <div className="flex-1">
                        <Label className="font-medium">{perm.name}</Label>
                        <p className="text-sm text-gray-600">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setPermissionsDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
