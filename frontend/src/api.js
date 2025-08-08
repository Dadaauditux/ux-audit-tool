// frontend/src/api.js
const API_BASE = "https://ux-audit-tool.onrender.com";
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'analyse");
  }

  return response.json();
}
