import { useEffect, useState } from "react";
import { useAppStatus } from "../../store/appStatus";
import { api } from "../../services/http";

export function BackendStatusBanner() {
  const { isOffline, setOffline } = useAppStatus();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-retry every 10 seconds when offline
  useEffect(() => {
    if (!isOffline) {
      setRetryCount(0);
      return;
    }

    const interval = setInterval(async () => {
      console.log("[BackendStatus] Auto-retrying connection...");
      setIsRetrying(true);
      try {
        // Try a health check endpoint
        await fetch(import.meta.env.VITE_API_URL || "http://localhost:3001" + "/health");
        console.log("[BackendStatus] Backend is back online!");
        setOffline(false);
        setRetryCount(0);
      } catch (error) {
        console.log("[BackendStatus] Still offline, will retry...");
        setRetryCount((c) => c + 1);
      } finally {
        setIsRetrying(false);
      }
    }, 10000); // retry every 10 seconds

    return () => clearInterval(interval);
  }, [isOffline, setOffline]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      await fetch(import.meta.env.VITE_API_URL || "http://localhost:3001" + "/health");
      setOffline(false);
      setRetryCount(0);
    } catch (error) {
      setRetryCount((c) => c + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold">Backend Server Unavailable</p>
            <p className="text-sm opacity-90">
              {isRetrying
                ? "Checking connection..."
                : `Unable to connect to the server. Auto-retrying... (attempt ${retryCount})`}
            </p>
          </div>
        </div>
        <button
          onClick={handleManualRetry}
          disabled={isRetrying}
          className="px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isRetrying ? "Retrying..." : "Retry Now"}
        </button>
      </div>
    </div>
  );
}
