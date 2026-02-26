import { createContext, useContext, useState, useEffect } from "react";
import { driveAPI } from "../utils/apiClient";

const DriveContext = createContext(null);

export function DriveProvider({ children }) {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(() => {
    return localStorage.getItem("selectedDriveId") || "all";
  });
  const [loadingDrives, setLoadingDrives] = useState(true);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem("authToken");
      // Use authenticated API if logged in, otherwise public endpoint
      const res = token ? await driveAPI.getAll() : await driveAPI.getActive();
      setDrives(res.data || []);
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
