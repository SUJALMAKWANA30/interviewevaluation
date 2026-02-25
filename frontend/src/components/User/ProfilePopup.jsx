import { useState, useEffect, useRef } from "react";
import { User, LogOut } from "lucide-react";

function ProfilePopup({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={popupRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold hover:opacity-90 transition cursor-pointer"
      >
        {user?.firstName?.[0] ?? "U"}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 z-50 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col items-center border-b border-slate-200 pb-5">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-slate-500" />
            </div>

            <p className="text-lg font-semibold text-slate-800">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {/* View Documentation */}
            <button
              onClick={() => window.open("/documentation", "_blank")}
              className="w-full py-2.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              View Documentation
            </button>

            {/* Sign Out */}
            <button
              onClick={onLogout}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePopup;
