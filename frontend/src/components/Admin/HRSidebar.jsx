import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  BarChart3,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

import { cn } from "../../utils/cn";

const navItems = [
  { label: "Dashboard", href: "/hr-home", icon: LayoutDashboard },
  { label: "Candidates", href: "/hr/candidate-dashboard", icon: Users },
  { label: "Exams", href: "/hr/exam", icon: FileText },
  { label: "Rounds", href: "/hr/rounds", icon: GitBranch },
  { label: "Reports", href: "/hr/reports", icon: BarChart3 },
  { label: "Admin Settings", href: "/admin-settings", icon: Settings },
];

export default function HrSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen shrink-0 bg-[#0f1e3d] text-white border-r border-white/10 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>

        {!collapsed && (
          <span className="ml-3 text-lg font-semibold tracking-wide">
            Tecnoprism
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center" : "justify-start",
                isActive
                  ? "bg-white/10 text-white shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        {/* Collapse */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center w-full rounded-lg px-4 py-3 text-sm transition-all duration-200",
            collapsed ? "justify-center" : "justify-start",
            "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="ml-3">Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <Link to="/hr-login">
          <button
            type="button"
            className={cn(
              "flex items-center w-full rounded-lg px-4 py-3 text-sm transition-all duration-200",
              collapsed ? "justify-center" : "justify-start",
              "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && (
              <span className="ml-3">Logout</span>
            )}
          </button>
        </Link>
      </div>
    </aside>
  );
}