import { Users, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import AddUserModal from "../../components/Admin/AddUserModal";

const initialUsers = [
  {
    id: 1,
    name: "Arun Kapoor",
    email: "arun@company.com",
    role: "HR Manager",
    active: true,
  },
  {
    id: 2,
    name: "Meera Joshi",
    email: "meera@company.com",
    role: "Recruiter",
    active: true,
  },
  {
    id: 3,
    name: "Sanjay Gupta",
    email: "sanjay@company.com",
    role: "HR Executive",
    active: false,
  },
  {
    id: 4,
    name: "Neha Reddy",
    email: "neha@company.com",
    role: "Senior Recruiter",
    active: true,
  },
];

const initialPermissions = [
  {
    action: "View Candidates",
    manager: true,
    recruiter: true,
    executive: true,
  },
  {
    action: "Edit Candidates",
    manager: true,
    recruiter: true,
    executive: false,
  },
  { action: "Export Data", manager: true, recruiter: false, executive: false },
  {
    action: "Delete Records",
    manager: true,
    recruiter: false,
    executive: false,
  },
  { action: "Manage Exams", manager: true, recruiter: true, executive: false },
  { action: "View Reports", manager: true, recruiter: true, executive: true },
  {
    action: "Admin Settings",
    manager: true,
    recruiter: false,
    executive: false,
  },
];

export default function AdminPanel() {
  const [users, setUsers] = useState(initialUsers);
  const [permissions, setPermissions] = useState(initialPermissions);

  const togglePermission = (index, role) => {
    const updated = [...permissions];
    updated[index][role] = !updated[index][role];
    setPermissions(updated);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveUser = (userData) => {
    const user = {
      id: users.length + 1,
      ...userData,
    };

    setUsers([...users, user]);
    setIsModalOpen(false);
  };

  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setLoading(false);
  //   }, 800); // simulate load
  //   return () => clearTimeout(timer);
  // }, []);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-100 px-6 animate-pulse">
  //       {/* Title */}
  //       <div className="mb-8">
  //         <div className="h-7 w-52 bg-gray-300 rounded mb-2"></div>
  //         <div className="h-4 w-72 bg-gray-200 rounded"></div>
  //       </div>

  //       {/* HR Users Skeleton */}
  //       <div className="bg-white rounded-xl border border-gray-200 mb-10 p-6">
  //         <div className="flex justify-between items-center mb-6">
  //           <div className="h-5 w-28 bg-gray-300 rounded"></div>
  //           <div className="h-9 w-32 bg-gray-300 rounded-lg"></div>
  //         </div>

  //         <div className="space-y-4">
  //           {[...Array(4)].map((_, i) => (
  //             <div key={i} className="grid grid-cols-5 gap-4 items-center">
  //               <div className="h-4 bg-gray-200 rounded col-span-1"></div>
  //               <div className="h-4 bg-gray-200 rounded col-span-1"></div>
  //               <div className="h-6 bg-gray-200 rounded-full col-span-1 w-24"></div>
  //               <div className="h-6 bg-gray-200 rounded-full col-span-1 w-20"></div>
  //               <div className="h-4 bg-gray-200 rounded col-span-1 w-16"></div>
  //             </div>
  //           ))}
  //         </div>
  //       </div>

  //       {/* Permission Matrix Skeleton */}
  //       <div className="bg-white rounded-xl border border-gray-200 p-6">
  //         <div className="h-5 w-40 bg-gray-300 rounded mb-6"></div>

  //         {[...Array(6)].map((_, i) => (
  //           <div key={i} className="grid grid-cols-4 gap-6 items-center mb-6">
  //             <div className="h-4 bg-gray-200 rounded"></div>
  //             <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
  //             <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
  //             <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-100 px-6">
      {/* ===== TITLE ===== */}
      <div className="mb-8">
        <h1 className="text-2xl text-left font-bold text-gray-800">
          Super Admin Panel
        </h1>
        <p className="text-gray-500 text-left text-sm">
          Manage HR users, roles, and permissions.
        </p>
      </div>

      {/* ===== HR USERS CARD ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-10">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="font-semibold text-gray-700">HR Users</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
          >
            <Users size={16} /> Add User
          </button>
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
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {user.name}
                    </td>

                    <td className="px-6 py-4 text-gray-500">{user.email}</td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs bg-gray-100 rounded-full text-gray-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          user.active
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 flex gap-3">
                      <Edit
                        size={16}
                        className="text-gray-600 cursor-pointer hover:text-black"
                      />
                      <Trash2
                        size={16}
                        className="text-red-500 cursor-pointer hover:text-red-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== PERMISSION MATRIX ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-left text-gray-700">
            Permission Matrix
          </h2>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="w-2/5 px-8 py-4 text-left font-bold">
                    Permission
                  </th>
                  <th className="w-1/5 px-8 py-4 text-left font-bold">
                    Manager
                  </th>
                  <th className="w-1/5 px-8 py-4 text-left font-bold">
                    Recruiter
                  </th>
                  <th className="w-1/5 px-8 py-4 text-left font-bold">
                    Executive
                  </th>
                </tr>
              </thead>

              <tbody>
                {permissions.map((perm, index) => (
                  <tr key={perm.action}>
                    <td className="px-8 py-5 font-medium text-gray-800 text-left">
                      {perm.action}
                    </td>

                    {["manager", "recruiter", "executive"].map((role) => (
                      <td key={role} className="px-8 py-5 align-middle">
                        <div className="flex items-center">
                          <button
                            onClick={() => togglePermission(index, role)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out cursor-pointer ${
                              perm[role] ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out ${
                                perm[role] ? "translate-x-6" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
}
