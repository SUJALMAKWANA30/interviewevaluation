import { createContext, useContext, useState, useEffect } from "react";

const DriveContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

export function DriveProvider({ children }) {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(() => {
    return localStorage.getItem("selectedDriveId") || "all";
  });
  const [loadingDrives, setLoadingDrives] = useState(true);

  const fetchDrives = async () => {
    try {
      const res = await fetch(`${API_BASE}/drives`);
      if (res.ok) {
        const json = await res.json();
        setDrives(json.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDrives(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedDriveId", selectedDriveId);
  }, [selectedDriveId]);

  const selectedDrive =
    selectedDriveId === "all"
      ? null
      : drives.find((d) => d._id === selectedDriveId) || null;

  return (
    <DriveContext.Provider
      value={{
        drives,
        selectedDriveId,
        setSelectedDriveId,
        selectedDrive,
        loadingDrives,
        refreshDrives: fetchDrives,
      }}
    >
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const ctx = useContext(DriveContext);
  if (!ctx) {
    throw new Error("useDrive must be used within a DriveProvider");
  }
  return ctx;
}
