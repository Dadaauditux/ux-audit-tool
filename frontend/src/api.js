import axios from "axios";

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

const response = await axios.post("http://localhost:5000/api/audit/upload", formData);
  return response.data;
}
