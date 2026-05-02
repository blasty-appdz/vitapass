import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

export default function DoctorDashboard({ nav, showToast }) {
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return nav("home");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setDoctor(profile);

    const { data: accesses, error } = await supabase
      .from("doctor_access")
      .select("id, access_level, granted_at, patient_id")
      .eq("doctor_id", user.id);

    if (error || !accesses || accesses.length === 0) {
      setPatients([]);
      setLoading(false);
      return;
    }

    const patientIds = accesses.map(a => a.patient_id);
    const { data: patientProfiles } = await supabase
      .from("profiles")
      .select("id, fname, lname, dob, blood")
      .in("id", patientIds);

    const merged = accesses.map(a => ({
      ...a,
      patient: (patientProfiles || []).find(p => p.id === a.patient_id) || null
    }));

    setPatients(merged);
    setLoading(false);
  }

  const filtered = patients.filter((a) => {
    const name = `${a.patient?.fname || ""} ${a.patient?.lname || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  function getInitials(p) {
    if (!p) return "?";
    return `${p.fname?.[0] || ""}${p.lname?.[0] || ""}`.toUpperCase() || "?";
  }

  function getFullName(p) {
    if (!p) return "–";
    return `${p.fname || ""} ${p.lname || ""}`.trim() || "–";
  }

  function getAge(dob) {
    if (!dob) return "–";
    return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)) + " ans";
  }

  function formatDate(ts) {
    if (!ts) return "–";
    return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }

  const SidebarContent = () => (
    <>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>VP</span>
        <span style={styles.logoText}>VitaPass</span>
      </div>
      <nav style={styles.nav}>
        <button style={{ ...styles.navItem, ...styles.navActive }} onClick={() => setSidebarOpen(false)}>
          <span>👥</span> Mes patients
        </button>
        <button style={styles.navItem} onClick={() => { setSidebarOpen(false); nav("doctor-appointments"); }}>
          <span>📅</span> Rendez-vous
        </button>
      </nav>
      <div style={styles.sidebarBottom}>
        <div style={styles.doctorCard}>
          <div style={styles.doctorAvatar}>{getInitials(doctor)}</div>
          <div>
            <div style={styles.doctorName}>{getFullName(doctor)}</div>
            <div style={styles.doctorRole}>Médecin</div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut().then(() => nav("home"))}>
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div style={styles.page}>

      {/* MOBILE TOPBAR */}
      <div style={styles.topbar}>
        <button style={styles.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>VP</span>
          <span style={styles.logoText}>VitaPass</span>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR MOBILE (drawer) */}
      <aside style={{ ...styles.sidebar, ...styles.sidebarMobile, ...(sidebarOpen ? styles.sidebarMobileOpen : {}) }}>
        <SidebarContent />
      </aside>

      {/* SIDEBAR DESKTOP */}
      <aside style={styles.sidebarDesktop}>
        <SidebarContent />
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Mes patients</h1>
          <p style={styles.subtitle}>
            {patients.length} patient{patients.length !== 1 ? "s" : ""} avec accès accordé
          </p>
        </header>

        <div style={styles.searchRow}>
          <div style={styles.searchWrap}>
            <span>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="Rechercher un patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}><p>Chargement…</p></div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48 }}>🏥</div>
            <p style={styles.emptyText}>
              {search ? "Aucun patient trouvé" : "Aucun patient ne vous a encore accordé l'accès"}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((access) => {
              const p = access.patient;
              return (
                <div
                  key={access.id}
                  style={styles.card}
                  onClick={() => p?.id && nav("doctor-patient", { patientId: p.id })}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.avatar}>{getInitials(p)}</div>
                    <div style={styles.accessBadge}>{access.access_level || "standard"}</div>
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.patientName}>{getFullName(p)}</h3>
                    <div style={styles.metaRow}>
                      <span style={styles.meta}>🎂 {getAge(p?.dob)}</span>
                      {p?.blood && (
                        <span style={{ ...styles.meta, ...styles.bloodType }}>🩸 {p.blood}</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.grantedAt}>Accès le {formatDate(access.granted_at)}</span>
                    <button style={styles.viewBtn}>Voir le dossier →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f4f8",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    flexDirection: "row",
  },

  // TOPBAR — visible uniquement mobile
  topbar: {
    display: "none",
    position: "fixed",
    top: 0, left: 0, right: 0,
    height: 56,
    background: "#0a2540",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    zIndex: 200,
    "@media (max-width: 768px)": { display: "flex" },
  },
  hamburger: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
  },

  // OVERLAY mobile
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 300,
  },

  // SIDEBAR base
  sidebar: {
    width: 240,
    background: "#0a2540",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    gap: 8,
  },

  // SIDEBAR desktop — toujours visible
  sidebarDesktop: {
    width: 240,
    background: "#0a2540",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    gap: 8,
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },

  // SIDEBAR mobile — drawer depuis la gauche
  sidebarMobile: {
    position: "fixed",
    top: 0, left: 0,
    height: "100vh",
    zIndex: 400,
    transform: "translateX(-100%)",
    transition: "transform 0.25s ease",
    display: "flex",
  },
  sidebarMobileOpen: {
    transform: "translateX(0)",
  },

  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 8 },
  logoIcon: { background: "#2dd4bf", color: "#0a2540", fontWeight: 800, fontSize: 14, borderRadius: 8, padding: "4px 7px" },
  logoText: { color: "#fff", fontWeight: 700, fontSize: 18 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#8ea6c0", fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left" },
  navActive: { background: "rgba(45,212,191,0.12)", color: "#2dd4bf" },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 },
  doctorCard: { display: "flex", alignItems: "center", gap: 10 },
  doctorAvatar: { width: 36, height: 36, borderRadius: "50%", background: "#2dd4bf", color: "#0a2540", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 },
  doctorName: { color: "#fff", fontSize: 13, fontWeight: 600 },
  doctorRole: { color: "#8ea6c0", fontSize: 11 },
  logoutBtn: { background: "rgba(255,255,255,0.06)", border: "none", color: "#8ea6c0", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", textAlign: "left" },

  main: {
    flex: 1,
    padding: "40px",
    // Sur mobile : padding top pour laisser place à la topbar
    paddingTop: 40,
  },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#0a2540", margin: 0 },
  subtitle: { color: "#64748b", fontSize: 14, margin: "4px 0 0" },
  searchRow: { marginBottom: 28 },
  searchWrap: { display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 16px", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", maxWidth: 400 },
  searchInput: { border: "none", outline: "none", fontSize: 14, color: "#0a2540", background: "transparent", width: "100%" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0a2540, #1e4d7b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
  accessBadge: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  cardBody: { display: "flex", flexDirection: "column", gap: 6 },
  patientName: { fontSize: 17, fontWeight: 700, color: "#0a2540", margin: 0 },
  metaRow: { display: "flex", gap: 12, alignItems: "center" },
  meta: { fontSize: 13, color: "#64748b" },
  bloodType: { background: "#fff1f2", color: "#e11d48", borderRadius: 6, padding: "1px 8px", fontWeight: 600 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 },
  grantedAt: { fontSize: 11, color: "#94a3b8" },
  viewBtn: { background: "#0a2540", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12, color: "#94a3b8" },
  emptyText: { fontSize: 15, textAlign: "center" },
};