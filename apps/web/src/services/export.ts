import { getAuth } from "firebase/auth";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function exportPdf(payload: {
  worldId: string;
  pageIds: string[];
  order?: string[];
}) {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`${API_URL}/export/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "world-export.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
