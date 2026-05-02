import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

export default function PatientRecord({ nav, showToast, patientId }) {
  const [patient, setPatient] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dossier");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessLevel, setAccessLevel] = useState(null);

  useEffect(() => {
    if (patientId) fetchAll();
  }, [patientId]);

  async function fetchAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return nav("home");

    const { data: access } = await supabase
      .from("doctor_access")
      .select("access_level")
      .eq("doctor_id", user.id)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (!access) {
      showToast && showToast("Accès non autorisé");
      return nav("doctor");
    }
    setAccessLevel(access.access_level);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", patientId)
      .maybeSingle();
    setPatient(profile);

    const { data: dos } = await supabase
      .from("dossiers")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();
    setDossier(dos);

    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    setDocuments(docs || []);

    setLoading(false);
  }

  async function saveNote() {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("documents").insert({
      patient_id: patientId,
      title: noteTitle,
      content: noteContent,
      type: "note_medecin",
      created_by: user.id,
    });

    if (error) {
      showToast && showToast("Erreur lors de l'enregistrement");
    } else {
      showToast && showToast("Note ajoutée ✓");
      setNoteTitle("");
      setNoteContent("");
      setShowNoteModal(false);
      fetchAll();
    }
    setSaving(false);
  }

  function getFullName(p) {
    if (!p) return "–";
    return `${p.fname || ""} ${p.lname || ""}`.trim() || "–";
  }

  function getInitials(p) {
    if (!p) return "?";
    return `${p.fname?.[0] || ""}${p.lname?.[0] || ""}`.toUpperCase() || "?";
  }

  function getAge(dob) {
    if (!dob) return "–";
    return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)) + " ans";
  }

  function formatDate(ts) {
    if (!ts) return "–";
    return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (loading) return <div style={styles.loadingPage}><p>Chargement du dossier…</p></div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => nav("doctor")}>← Retour</button>
        <button style={styles.noteBtn} onClick={() => setShowNoteModal(true)}>+ Ajouter une note</button>
      </header>

      <div style={styles.content}>
        <div style={styles.patientCard}>
          <div style={styles.patientAvatar}>{getInitials(patient)}</div>
          <div style={styles.patientInfo}>
            <h1 style={styles.patientName}>{getFullName(patient)}</h1>
            <div style={styles.patientMeta}>
              <span>🎂 {getAge(patient?.dob)}</span>
              {patient?.blood && <span style={styles.bloodBadge}>🩸 {patient.blood}</span>}
              <span style={styles.accessBadge}>Accès : {accessLevel}</span>
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          {["dossier", "documents"].map((tab) => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dossier" ? "📋 Dossier médical" : `📄 Documents (${documents.length})`}
            </button>
          ))}
        </div>

        {activeTab === "dossier" && (
          <div style={styles.grid}>
            <Section title="Informations médicales">
              <Row label="Groupe sanguin" value={dossier?.blood || patient?.blood} />
              <Row label="Taille" value={dossier?.height ? `${dossier.height} cm` : null} />
              <Row label="Poids" value={dossier?.weight ? `${dossier.weight} kg` : null} />
              <Row label="Fumeur" value={dossier?.smoker === true ? "Oui" : dossier?.smoker === false ? "Non" : null} />
            </Section>
            <Section title="Antécédents médicaux">
              <TextBlock value={dossier?.medical_history} />
            </Section>
            <Section title="Allergies">
              <TextBlock value={dossier?.allergies} />
            </Section>
            <Section title="Traitements en cours">
              <TextBlock value={dossier?.current_treatments} />
            </Section>
            <Section title="Maladies chroniques">
              <TextBlock value={dossier?.chronic_diseases} />
            </Section>
            <Section title="Chirurgies">
              <TextBlock value={dossier?.surgeries} />
            </Section>
          </div>
        )}

        {activeTab === "documents" && (
          <div style={styles.docsList}>
            {documents.length === 0 ? (
              <div style={styles.empty}>Aucun document pour ce patient.</div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} style={styles.docCard}>
                  <div style={styles.docHeader}>
                    <div>
                      <div style={styles.docTitle}>{doc.title}</div>
                      <div style={styles.docMeta}>
                        {doc.type === "note_medecin" ? "📝 Note médecin" : "📄 " + (doc.type || "Document")}
                        {" · "}{formatDate(doc.created_at)}
                      </div>
                    </div>
                    {doc.type === "note_medecin" && <span style={styles.noteBadge}>Note</span>}
                  </div>
                  {doc.content && <p style={styles.docContent}>{doc.content}</p>}
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" style={styles.docLink}>Voir le fichier →</a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showNoteModal && (
        <div style={styles.overlay} onClick={() => setShowNoteModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Ajouter une note médicale</h2>
            <input
              style={styles.modalInput}
              placeholder="Titre de la note"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <textarea
              style={styles.modalTextarea}
              placeholder="Observations, prescriptions, compte-rendu…"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
            />
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowNoteModal(false)}>Annuler</button>
              <button style={styles.saveBtn} onClick={saveNote} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value || <em style={{ color: "#cbd5e1" }}>Non renseigné</em>}</span>
    </div>
  );
}

function TextBlock({ value }) {
  if (!value) return <em style={{ color: "#cbd5e1", fontSize: 13 }}>Non renseigné</em>;
  return <p style={styles.textBlock}>{value}</p>;
}

const styles = {
  page: { minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  loadingPage: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#64748b" },
  header: { background: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  backBtn: { background: "none", border: "none", color: "#0a2540", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  noteBtn: { background: "#0a2540", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  content: { maxWidth: 960, margin: "0 auto", padding: "24px 16px" },
  patientCard: { background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flexWrap: "wrap" },
  patientAvatar: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #0a2540, #1e4d7b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, flexShrink: 0 },
  patientInfo: { flex: 1, minWidth: 0 },
  patientName: { fontSize: 20, fontWeight: 700, color: "#0a2540", margin: "0 0 8px" },
  patientMeta: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: 13, color: "#64748b" },
  bloodBadge: { background: "#fff1f2", color: "#e11d48", borderRadius: 6, padding: "2px 8px", fontWeight: 600 },
  accessBadge: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 },
  tabs: { display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" },
  tab: { background: "transparent", border: "none", padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#64748b", cursor: "pointer" },
  tabActive: { background: "#fff", color: "#0a2540", fontWeight: 700, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  section: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" },
  row: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc" },
  rowLabel: { fontSize: 13, color: "#64748b" },
  rowValue: { fontSize: 13, fontWeight: 600, color: "#0a2540" },
  textBlock: { fontSize: 14, color: "#334155", lineHeight: 1.6, margin: 0 },
  docsList: { display: "flex", flexDirection: "column", gap: 12 },
  docCard: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  docHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  docTitle: { fontSize: 15, fontWeight: 700, color: "#0a2540" },
  docMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  noteBadge: { background: "#fef3c7", color: "#d97706", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 },
  docContent: { fontSize: 14, color: "#334155", lineHeight: 1.6, margin: 0 },
  docLink: { color: "#2563eb", fontSize: 13, textDecoration: "none", fontWeight: 600 },
  empty: { textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 14 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "0 16px" },
  modal: { background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#0a2540", margin: 0 },
  modalInput: { border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" },
  modalTextarea: { border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
  modalActions: { display: "flex", gap: 12, justifyContent: "flex-end" },
  cancelBtn: { background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#64748b" },
  saveBtn: { background: "#0a2540", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};