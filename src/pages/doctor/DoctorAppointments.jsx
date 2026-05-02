import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

export default function DoctorAppointments({ nav, showToast }) {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchRdvs();
  }, []);

  async function fetchRdvs() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return nav("home");

    const { data: rdvData } = await supabase
      .from("rdvs")
      .select("id, title, date, time, detail, patient_id, doctor_id")
      .eq("doctor_id", user.id)
      .order("date", { ascending: true });

    if (!rdvData || rdvData.length === 0) {
      setRdvs([]);
      setLoading(false);
      return;
    }

    const patientIds = [...new Set(rdvData.map(r => r.patient_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, fname, lname")
      .in("id", patientIds);

    const merged = rdvData.map(r => ({
      ...r,
      patient: (profiles || []).find(p => p.id === r.patient_id) || null
    }));

    setRdvs(merged);
    setLoading(false);
  }

  function getFullName(p) {
    if (!p) return "–";
    return `${p.fname || ""} ${p.lname || ""}`.trim() || "–";
  }

  function isUpcoming(rdv) {
    const d = new Date(`${rdv.date}T${rdv.time || "00:00"}`);
    return d >= new Date();
  }

  const filtered = rdvs.filter((r) => {
    if (filter === "upcoming") return isUpcoming(r);
    if (filter === "past") return !isUpcoming(r);
    return true;
  });

  function formatDate(dateStr) {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }

  const grouped = filtered.reduce((acc, rdv) => {
    const key = rdv.date || "Sans date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(rdv);
    return acc;
  }, {});

  const SidebarContent = () => (
    <>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>VP</span>
        <span style={styles.logoText}>VitaPass</span>
      </div>
      <nav style={styles.nav}>
        <button style={styles.navItem} onClick={() => { setSidebarOpen(false); nav("doctor"); }}>
          <span>👥</span> Mes patients
        </button>
        <button style={{ ...styles.navItem, ...styles.navActive }} onClick={() => setSidebarOpen(false)}>
          <span>📅</span> Rendez-vous
        </button>
      </nav>
      <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut().then(() => nav("home"))}>
        Déconnexion
      </button>
    </>
  );

  return (
    <div style={styles.page}>

      {/* TOPBAR MOBILE */}
      <div style={styles.topbar}>
        <button style={styles.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>VP</span>
          <span style={styles.logoText}>VitaPass</span>
        </div>
      </div>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR MOBILE */}
      <aside style={{
        ...styles.sidebar,
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 400,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: window.innerWidth < 768 ? "flex" : "none",
      }}>
        <SidebarContent />
      </aside>

      {/* SIDEBAR DESKTOP */}
      <aside style={styles.sidebarDesktop}>
        <SidebarContent />
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Rendez-vous</h1>
          <p style={styles.subtitle}>{filtered.length} rendez-vous affichés</p>
        </header>

        <div style={styles.filters}>
          {[{ key: "upcoming", label: "À venir" }, { key: "past", label: "Passés" }, { key: "all", label: "Tous" }].map((f) => (
            <button
              key={f.key}
              style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterActive : {}) }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.empty}><p>Chargement…</p></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 40 }}>📅</div>
            <p>Aucun rendez-vous {filter === "upcoming" ? "à venir" : filter === "past" ? "passé" : ""}</p>
          </div>
        ) : (
          <div style={styles.timeline}>
            {Object.entries(grouped).map(([date, rdvList]) => (
              <div key={date} style={styles.dayGroup}>
                <div style={styles.dateLabel}>{formatDate(date)}</div>
                <div style={styles.rdvList}>
                  {rdvList.map((rdv) => (
                    <div key={rdv.id} style={styles.rdvCard}>
                      <div style={styles.timeCol}>
                        <span style={styles.time}>{rdv.time?.slice(0, 5) || "–"}</span>
                      </div>
                      <div style={styles.rdvBody}>
                        <div style={styles.rdvTitle}>{rdv.title || "Consultation"}</div>
                        <div style={styles.rdvPatient}>👤 {getFullName(rdv.patient)}</div>
                        {rdv.detail && <div style={styles.rdvDetail}>{rdv.detail}</div>}
                      </div>
                      <button style={styles.dossierBtn} onClick={() => nav("doctor-patient", { patientId: rdv.patient_id })}>
                        Dossier →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', system-ui, sans-serif" },

  topbar: { display: "none", position: "fixed", top: 0, left: 0, right: 0, height: 56, background: "#0a2540", alignItems: "center", gap: 12, padding: "0 16px", zIndex: 200 },
  hamburger: { background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 4 },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300 },

  sidebar: { width: 240, background: "#0a2540", display: "flex", flexDirection: "column", padding: "24px 16px", gap: 8 },

  sidebarDesktop: { width: 240, background: "#0a2540", display: "flex", flexDirection: "column", padding: "24px 16px", gap: 8, position: "sticky", top: 0, height: "100vh", flexShrink: 0 },

  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 8 },
  logoIcon: { background: "#2dd4bf", color: "#0a2540", fontWeight: 800, fontSize: 14, borderRadius: 8, padding: "4px 7px" },
  logoText: { color: "#fff", fontWeight: 700, fontSize: 18 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#8ea6c0", fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left" },
  navActive: { background: "rgba(45,212,191,0.12)", color: "#2dd4bf" },
  logoutBtn: { background: "rgba(255,255,255,0.06)", border: "none", color: "#8ea6c0", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", textAlign: "left" },

  main: { flex: 1, padding: "40px 24px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0a2540", margin: 0 },
  subtitle: { color: "#64748b", fontSize: 14, margin: "4px 0 0" },
  filters: { display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" },
  filterBtn: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "7px 18px", fontSize: 13, fontWeight: 500, color: "#64748b", cursor: "pointer" },
  filterActive: { background: "#0a2540", color: "#fff", border: "1px solid #0a2540" },
  timeline: { display: "flex", flexDirection: "column", gap: 28 },
  dayGroup: {},
  dateLabel: { fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  rdvList: { display: "flex", flexDirection: "column", gap: 10 },
  rdvCard: { background: "#fff", borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", flexWrap: "wrap" },
  timeCol: { minWidth: 48, textAlign: "center" },
  time: { fontSize: 16, fontWeight: 700, color: "#0a2540" },
  rdvBody: { flex: 1, minWidth: 0 },
  rdvTitle: { fontSize: 15, fontWeight: 700, color: "#0a2540", marginBottom: 4 },
  rdvPatient: { fontSize: 13, color: "#64748b" },
  rdvDetail: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  dossierBtn: { background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "#0a2540", cursor: "pointer" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12, color: "#94a3b8" },
};