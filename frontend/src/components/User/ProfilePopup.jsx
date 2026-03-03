import { useState, useEffect, useRef } from "react";
import {
  User,
  LogOut,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  FileText,
  Image,
  CreditCard,
  FileCheck,
  ExternalLink,
} from "lucide-react";

function ProfilePopup({ user, onLogout, photoSrc }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;

  const driveLink = (fileId) => {
    if (!fileId) return null;
    if (/^https?:\/\//i.test(fileId)) return fileId;
    return `https://drive.google.com/file/d/${fileId}/view`;
  };

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const docs = user.documents || {};
  const docList = [
    { label: "Resume", key: "resume", icon: FileText },
    { label: "ID Proof", key: "idProof", icon: FileCheck },
    { label: "Photo", key: "photo", icon: Image },
    { label: "Payslips", key: "payslips", icon: CreditCard },
    { label: "Last Breakup", key: "lastBreakup", icon: FileText },
  ].filter((d) => docs[d.key]);

  const expLevels = user.experienceLevels || {};
  const expEntries = Object.entries(expLevels).filter(
    ([, v]) => v && v !== "" && v !== "No Experience"
  );

  const InfoRow = ({ icon: Icon, label, value }) => {
    if (!value || value === "—") return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-sm text-slate-700 break-words">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative" ref={popupRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold hover:opacity-90 transition cursor-pointer overflow-hidden"
        >
          {photoSrc ? (
            <img src={photoSrc} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; e.target.parentNode.textContent = user.firstName?.[0] ?? "U"; }} />
          ) : (
            user.firstName?.[0] ?? "U"
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 z-50 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col items-center border-b border-slate-200 pb-5">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 mb-3"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold mb-3">
                  {initials}
                </div>
              )}
              <p className="text-lg font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
              {user.uniqueId && (
                <p className="text-xs text-slate-400 mt-1 font-mono">{user.uniqueId}</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-3">
              <button
                onClick={() => { setShowProfile(true); setIsOpen(false); }}
                className="w-full py-2.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                View Profile
              </button>
              <button
                onClick={onLogout}
                className="w-full py-2.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">My Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-6 space-y-8">
              {/* Profile Hero */}
              <div className="flex items-center gap-5">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
                    {initials}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  {user.uniqueId && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">{user.uniqueId}</p>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Personal Information
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <InfoRow icon={Phone} label="Phone" value={user.phone} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(user.dateOfBirth)} />
                  <InfoRow icon={MapPin} label="Preferred Location" value={user.preferredLocation} />
                  <InfoRow icon={MapPin} label="Willing to Relocate" value={user.willingToRelocate} />
                </div>
              </div>

              {/* Professional Details */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Professional Details
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <InfoRow icon={Briefcase} label="Position Applied" value={user.positionApplied} />
                  <InfoRow icon={Briefcase} label="Current Designation" value={user.currentDesignation} />
                  <InfoRow icon={Briefcase} label="Total Experience" value={user.totalExperience} />
                  <InfoRow icon={Briefcase} label="Notice Period" value={user.noticePeriod} />
                  <InfoRow icon={GraduationCap} label="Highest Education" value={user.highestEducation} />
                  <InfoRow icon={CreditCard} label="Current CTC" value={user.currentCTC} />
                </div>

                {/* Skills */}
                {user.skills?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Levels */}
                {expEntries.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Experience Levels</p>
                    <div className="flex flex-wrap gap-2">
                      {expEntries.map(([key, val]) => (
                        <span
                          key={key}
                          className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full border border-purple-200"
                        >
                          {key.toUpperCase()}: {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              {docList.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Documents
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    {docList.map(({ label, key, icon: DocIcon }) => {
                      const link = driveLink(docs[key]);
                      return (
                        <a
                          key={key}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white transition group"
                        >
                          <DocIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                          <span className="text-sm text-slate-700 group-hover:text-blue-600 flex-1">
                            {label}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowProfile(false)}
                className="px-5 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfilePopup;
