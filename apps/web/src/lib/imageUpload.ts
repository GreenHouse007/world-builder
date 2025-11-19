const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  // Get auth token from Firebase
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    headers: authHeader ? { Authorization: authHeader } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json();
  return data.url;
}

async function getAuthHeader(): Promise<string | null> {
  try {
    // Try to get Firebase auth token
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      return `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Could not get auth token:", error);
  }

  return null;
}
