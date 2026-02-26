import {
  Users,
  Edit,
  Trash2,
  Shield,
  Plus,
  Search,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { adminAPI } from "../../utils/apiClient";
import { usePermissions } from "../../hooks/usePermissions";
import AddUserModal from "../../components/Admin/AddUserModal";

export default function AdminPanel() {
  const { isSuperAdmin, isAdmin, can } = usePermissions();
  const canManageUsers = can("users", "create");

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionModules, setPermissionModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Role form
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleLevel, setRoleLevel] = useState(2);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [savingRole, setSavingRole] = useState(false);

  // Search
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, modulesRes] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getRoles(),
        adminAPI.getPermissionModules(),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setPermissionModules(modulesRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  // ============ USER ACTIONS ============

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await adminAPI.updateUser(editingUser._id, userData);
        toast.success("User updated successfully");
      } else {
        await adminAPI.createUser(userData);
        toast.success("User created successfully");
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success("User status updated");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to toggle user");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete "${userName}"?`)) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deleted");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  // ============ ROLE ACTIONS ============

  const openRoleForm = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleLevel(role.level);
      setRolePermissions(role.permissions || []);
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleLevel(2);
      setRolePermissions([]);
    }
    setShowRoleForm(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    setSavingRole(true);
    try {
      const data = {
        name: roleName,
        level: roleLevel,
        permissions: rolePermissions,
      };
      if (editingRole) {
        await adminAPI.updateRole(editingRole._id, data);
        toast.success("Role updated");
      } else {
        await adminAPI.createRole(data);
        toast.success("Role created");
      }
      setShowRoleForm(false);
      setEditingRole(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleId, name) => {
    const usersInRole = users.filter((u) => u.role?._id === roleId).length;
    const warning = usersInRole > 0
      ? `This will also delete ${usersInRole} user(s) assigned to this role.`
      : "";
    if (!confirm(`Are you sure you want to delete role "${name}"?${warning ? `\n\n⚠️ ${warning}` : ""}`)) return;
    try {
      await adminAPI.deleteRole(roleId);
      toast.success("Role deleted");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  const togglePermAction = (moduleKey, action) => {
    setRolePermissions((prev) => {
      const existing = prev.find((p) => p.module === moduleKey);
      if (existing) {
        const hasAction = existing.actions.includes(action);
        if (hasAction) {
          const newActions = existing.actions.filter((a) => a !== action);
          if (newActions.length === 0) {
            return prev.filter((p) => p.module !== moduleKey);
          }
          return prev.map((p) =>
            p.module === moduleKey ? { ...p, actions: newActions } : p
          );
        } else {
          return prev.map((p) =>
            p.module === moduleKey
              ? { ...p, actions: [...p.actions, action] }
              : p
          );
        }
      } else {
        return [...prev, { module: moduleKey, actions: [action] }];
      }
    });
  };

  const hasPermAction = (moduleKey, action) => {
    const found = rolePermissions.find((p) => p.module === moduleKey);
    return found ? found.actions.includes(action) : false;
  };

  // Toggle all actions for a module
  const toggleModuleAll = (mod) => {
    const allSelected = mod.actions.every((a) => hasPermAction(mod.module, a));
    if (allSelected) {
      // Remove all actions for this module
      setRolePermissions((prev) => prev.filter((p) => p.module !== mod.module));
    } else {
      // Select all actions
      setRolePermissions((prev) => {
        const without = prev.filter((p) => p.module !== mod.module);
        return [...without, { module: mod.module, actions: [...mod.actions] }];
      });
    }
  };

  // Presets
  const applyPreset = (preset) => {
    if (preset === "full") {
      setRolePermissions(
        permissionModules.map((m) => ({ module: m.module, actions: [...m.actions] }))
      );
    } else if (preset === "viewOnly") {
      setRolePermissions(
        permissionModules
          .filter((m) => m.actions.includes("view"))
          .map((m) => ({ module: m.module, actions: ["view"] }))
      );
    } else if (preset === "none") {
      setRolePermissions([]);
    }
  };

  // Expanded module in role form
  const [expandedModule, setExpandedModule] = useState(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6">
      {/* ===== TITLE ===== */}
      <div className="mb-8">
        <h1 className="text-2xl text-left font-bold text-gray-800">
          {isSuperAdmin ? "Super Admin Panel" : "Admin Panel"}
        </h1>
        <p className="text-gray-500 text-left text-sm">
          Manage HR users, roles, and permissions.
        </p>
      </div>

      {/* ===== ROLES SECTION (Super Admin only) ===== */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-10">
          <div className="flex justify-between items-center px-6 py-4">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Shield size={18} /> Roles
            </h2>
            <button
              onClick={() => openRoleForm()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
            >
              <Plus size={16} /> Add Role
            </button>
          </div>

          <div className="px-4 pb-6">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Role Name</th>
                    <th className="px-6 py-3">Access Level</th>
                    <th className="px-6 py-3">Permissions</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => {
                    const levelLabels = {
                      0: "Super Admin",
                      1: "Admin",
                      2: "Manager",
                      3: "Recruiter",
                      4: "Executive",
                    };
                    const levelColors = {
                      0: "bg-purple-100 text-purple-700",
                      1: "bg-red-50 text-red-700",
                      2: "bg-blue-50 text-blue-700",
                      3: "bg-green-50 text-green-700",
                      4: "bg-gray-100 text-gray-600",
                    };
                    const totalPerms = (role.permissions || []).reduce(
                      (sum, p) => sum + (p.actions?.length || 0), 0
                    );

                    return (
                      <tr key={role._id} className="border-t border-gray-100">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{role.name}</span>
                          {role.isSystem && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-50 text-amber-600 rounded-full">
                              System
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${levelColors[role.level] || "bg-gray-100 text-gray-600"}`}>
                            {levelLabels[role.level] || `Level ${role.level}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {totalPerms > 0
                            ? `${(role.permissions || []).length} modules · ${totalPerms} actions`
                            : "No permissions"}
                        </td>
                        <td className="px-6 py-4 flex gap-3">
                          {!role.isSystem && (
                            <>
                              <Edit
                                size={16}
                                className="text-gray-600 cursor-pointer hover:text-black"
                                onClick={() => openRoleForm(role)}
                              />
                              <Trash2
                                size={16}
                                className="text-red-500 cursor-pointer hover:text-red-700"
                                onClick={() =>
                                  handleDeleteRole(role._id, role.name)
                                }
                              />
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Form */}
          {showRoleForm && (
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {editingRole ? "Edit Role" : "Create New Role"}
                </h3>
                <p className="text-xs text-gray-400 mb-5">
                  {editingRole
                    ? "Update role name, access level, and permissions."
                    : "Give your role a name, pick an access level, and choose what this role can do."}
                </p>

                {/* Row 1: Name + Level */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g. Senior Recruiter"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Level
                    </label>
                    <select
                      value={roleLevel}
                      onChange={(e) => setRoleLevel(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={1}>Admin — Full management access</option>
                      <option value={2}>Manager — Team-level access</option>
                      <option value={3}>Recruiter — Standard HR access</option>
                      <option value={4}>Executive — View & limited actions</option>
                    </select>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Permissions
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => applyPreset("full")}
                        className="px-3 py-1 text-xs rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer"
                      >
                        Full Access
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("viewOnly")}
                        className="px-3 py-1 text-xs rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      >
                        View Only
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("none")}
                        className="px-3 py-1 text-xs rounded-md bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {permissionModules.map((mod) => {
                      const selectedCount = (rolePermissions.find((p) => p.module === mod.module)?.actions || []).length;
                      const allSelected = mod.actions.every((a) => hasPermAction(mod.module, a));
                      const isExpanded = expandedModule === mod.module;

                      return (
                        <div
                          key={mod.module}
                          className="border border-gray-200 rounded-lg bg-white overflow-hidden"
                        >
                          {/* Module Header — click to expand */}
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                            onClick={() =>
                              setExpandedModule(isExpanded ? null : mod.module)
                            }
                          >
                            <div className="flex items-center gap-3">
                              {/* Select-all checkbox */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModuleAll(mod);
                                }}
                                className={`w-5 h-5 rounded flex items-center justify-center border transition cursor-pointer ${
                                  allSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : selectedCount > 0
                                      ? "bg-blue-100 border-blue-400 text-blue-600"
                                      : "border-gray-300"
                                }`}
                              >
                                {(allSelected || selectedCount > 0) && (
                                  <Check size={13} strokeWidth={3} />
                                )}
                              </button>
                              <span className="text-sm font-medium text-gray-800">
                                {mod.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {selectedCount}/{mod.actions.length} selected
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={16} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={16} className="text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded actions */}
                          {isExpanded && (
                            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2 border-t border-gray-100">
                              {mod.actions.map((action) => {
                                const active = hasPermAction(mod.module, action);
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    onClick={() =>
                                      togglePermAction(mod.module, action)
                                    }
                                    className={`px-3 py-1.5 text-xs rounded-full border transition cursor-pointer capitalize ${
                                      active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                                    }`}
                                  >
                                    {action}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowRoleForm(false);
                      setEditingRole(null);
                      setExpandedModule(null);
                    }}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={savingRole}
                    className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    {savingRole ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== HR USERS CARD ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-10">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={18} /> HR Users
          </h2>
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            {canManageUsers && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
              >
                <Plus size={16} /> Add User
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Login</th>
                  {canManageUsers && <th className="px-6 py-3">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                        {user.role?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          canManageUsers && handleToggleUser(user._id)
                        }
                        className={`px-3 py-1 text-xs rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-500"
                        } ${canManageUsers ? "cursor-pointer hover:opacity-80" : ""}`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString()
                        : "Never"}
                    </td>
                    {canManageUsers && (
                      <td className="px-6 py-4 flex gap-3">
                        <Edit
                          size={16}
                          className="text-gray-600 cursor-pointer hover:text-black"
                          onClick={() => {
                            setEditingUser(user);
                            setIsUserModalOpen(true);
                          }}
                        />
                        {user.role?.level !== 0 && (
                          <Trash2
                            size={16}
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            onClick={() =>
                              handleDeleteUser(user._id, user.name)
                            }
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddUserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        roles={roles}
        editingUser={editingUser}
      />
    </div>
  );
}
