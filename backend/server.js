import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import auditRoute from "./routes/audit.js"; // ✅ chemin corrigé

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Routes
app.use("/api/audit", auditRoute);

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend UX Audit Tool actif !");
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
});
