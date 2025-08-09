// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage } from "./api";
import AnnotatedImage from "./AnnotatedImage";
import LegendPanel from "./LegendPanel";
import "./global.css"; // <-- ajout du global CSS reset

function App() {
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [visibleTypes, setVisibleTypes] = useState([
    "text",
    "contrast",
    "button",
    "heading-hierarchy",
    "spacing",
    "alignment",
  ]);

  const toggleType = (type) => {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const onDrop = (acceptedFiles, fileRejections) => {
    if (fileRejections.length) {
      alert("Fichier non valide (type ou taille).");
      return;
    }
    const selected = acceptedFiles[0];
    setFile(selected);
    setSrc(null);
    setResult(null);
    setErrorMsg(null);
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      accept: { "image/*": [] },
      multiple: false,
      maxSize: 10 * 1024 * 1024,
      onDrop,
    });

  const canvasScrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(null);

  useEffect(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      @media (max-width: 960px) {
        .mainGrid { grid-template-columns: 1fr !important; }
        .sidebar { position: static !important; margin-top: 12px; }
      }
    `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    if (src) URL.revokeObjectURL(src);

    const fileURL = URL.createObjectURL(file);
    setSrc(fileURL);
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await uploadImage(file);
      setResult(data);
      setFile(null);
    } catch (error) {
      console.error("Erreur API :", error);
      setErrorMsg(
        (error && error.message) ||
          "Impossible d’analyser l’image. Vérifie que le backend est démarré."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    if (src) URL.revokeObjectURL(src);
    setFile(null);
    setSrc(null);
    setResult(null);
    setErrorMsg(null);
  };

  const issues =
    result &&
    [
      ...(result.groupedTextSizeIssues || []).map((g) => ({
        ...g,
        type: "text",
        message: "Texte trop petit",
      })),
      ...(result.groupedContrastIssues || []).map((g) => ({
        ...g,
        type: "contrast",
        message: "Contraste insuffisant",
      })),
      ...(result.groupedButtonSizeIssues || []).map((g) => ({
        ...g,
        type: "button",
        message: "Bouton trop petit",
      })),
      ...(result.headingIssues || []).map((g) => ({
        ...g,
        type: "heading-hierarchy",
        message: "Titre mal hiérarchisé",
      })),
      ...(result.spacingIssues || []).map((g) => ({
        ...g,
        type: "spacing",
        message: "Espacement incohérent",
      })),
      ...(result.alignmentIssues || []).map((g) => ({
        ...g,
        type: "alignment",
        message: "Alignement incohérent",
      })),
    ].filter((i) => visibleTypes.includes(i.type));

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo} role="img" aria-label="loupe">🔍</span>
          <h1 style={styles.title}>UX Audit Tool</h1>
        </div>
      </header>

      {!result && (
        <section style={styles.panel}>
          <div
            {...getRootProps({
              style: {
                ...styles.dropzone,
                borderColor: isDragActive ? "#3b82f6" : "#cbd5e1",
                background: isDragActive ? "#f1f5f9" : "#fff",
              },
            })}
          >
            <input {...getInputProps()} />
            <p style={styles.dropText}>
              {isDragActive
                ? "Dépose l’image ici…"
                : "Glisse/dépose une image ou clique pour sélectionner"}
            </p>
            {acceptedFiles[0] && !result && (
              <p style={styles.fileName}>
                Fichier sélectionné : {acceptedFiles[0].name}
              </p>
            )}
          </div>
          <div style={styles.actions}>
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              style={{
                ...styles.primaryBtn,
                ...(loading || !file ? styles.btnDisabled : {}),
              }}
            >
              {loading ? "Analyse en cours…" : "Analyser"}
            </button>
            {errorMsg && <p style={styles.error}>{errorMsg}</p>}
          </div>
        </section>
      )}

      {src && result && (
        <main style={styles.mainGrid} className="mainGrid">
          <div style={styles.canvasCard}>
            <div style={styles.canvasHeader}>
              <button onClick={resetAll} style={styles.secondaryBtn}>
                Nouvelle image
              </button>
            </div>
            <div style={styles.canvasScroll} ref={canvasScrollRef}>
              <AnnotatedImage
                src={src}
                containerWidth={containerWidth}
                issues={issues || []}
              />
            </div>
          </div>
          <aside style={styles.sidebar} className="sidebar">
            <div style={styles.card}>
              <LegendPanel
                visibleTypes={visibleTypes}
                toggleType={toggleType}
              />
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}

const styles = {
  page: { fontFamily: "Inter, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a", padding: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800 },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16 },
  dropzone: { border: "2px dashed #cbd5e1", borderRadius: 10, padding: 16, textAlign: "center", transition: "all .15s ease", cursor: "pointer", width: "100%" },
  dropText: { margin: 0, color: "#475569" },
  fileName: { marginTop: 8, fontSize: 12, color: "#64748b" },
  actions: { display: "flex", alignItems: "center", gap: 12, marginTop: 12 },
  primaryBtn: { background: "#2563eb", color: "white", fontWeight: 700, border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer" },
  secondaryBtn: { background: "#e2e8f0", color: "#0f172a", fontWeight: 600, border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
  btnDisabled: { background: "#cbd5e1", cursor: "not-allowed" },
  error: { color: "#b91c1c", margin: 0 },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" },
  canvasCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 8, minHeight: 200 },
  canvasHeader: { display: "flex", justifyContent: "flex-end", marginBottom: 8 },
  canvasScroll: { overflow: "auto", maxHeight: "70vh", borderRadius: 8 },
  sidebar: { position: "sticky", top: 24 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 },
};

export default App;
