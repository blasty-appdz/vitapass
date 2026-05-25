import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const SPECIALITES = [
  'Médecine générale', 'Cardiologie', 'Dermatologie', 'Gynécologie',
  'Neurologie', 'Ophtalmologie', 'Orthopédie', 'Pédiatrie',
  'Psychiatrie', 'Radiologie', 'Rhumatologie', 'Urologie',
  'ORL', 'Gastro-entérologie', 'Endocrinologie', 'Pneumologie',
  'Néphrologie', 'Infectiologie', 'Anesthésiologie', 'Chirurgie générale'
]

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra',
  'Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret',
  'Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda',
  'Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem',
  "M'Sila",'Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj',
  'Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela',
  'Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane'
]

const LANGUES = ['Arabe', 'Français', 'Tamazight', 'Anglais']

const ETAPES = [
  { id: 1, label: 'Identité' },
  { id: 2, label: 'Spécialité' },
  { id: 3, label: 'Cabinet' },
  { id: 4, label: 'Récap' },
]

export default function ProfessionalOnboarding({ nav }) {
  const [etape, setEtape] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)

  const [form, setForm] = useState({
    fname: '', lname: '', gender: 'Masculin', telephone: '',
    specialite: '', sous_specialite: '', numero_ordre: '',
    wilaya: '', adresse: '', tarif: 2000, duree_rdv: 30,
    langues: ['Français'], bio: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id)
    })
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleLangue = (langue) => {
    setForm(f => ({
      ...f,
      langues: f.langues.includes(langue)
        ? f.langues.filter(l => l !== langue)
        : [...f.langues, langue]
    }))
  }

  const validerEtape = () => {
    setError('')
    if (etape === 1) {
      if (!form.fname.trim() || !form.lname.trim()) return setError('Prénom et nom requis')
      if (!form.telephone.trim()) return setError('Téléphone requis')
    }
    if (etape === 2) {
      if (!form.specialite) return setError('Spécialité requise')
    }
    if (etape === 3) {
      if (!form.wilaya) return setError('Wilaya requise')
      if (!form.adresse.trim()) return setError('Adresse requise')
    }
    setEtape(e => e + 1)
  }

  const soumettre = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase
        .from('professionals')
        .update({
          fname: form.fname.trim(),
          lname: form.lname.trim(),
          gender: form.gender,
          telephone: form.telephone.trim(),
          specialite: form.specialite,
          sous_specialite: form.sous_specialite.trim() || null,
          numero_ordre: form.numero_ordre.trim() || null,
          wilaya: form.wilaya,
          adresse: form.adresse.trim(),
          tarif: Number(form.tarif),
          duree_rdv: Number(form.duree_rdv),
          langues: form.langues,
          bio: form.bio.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (err) throw err
      nav('pro-schedule')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>🩺 VitaPass Pro</div>
        <p style={styles.subtitle}>Complétez votre profil pour recevoir des patients</p>
      </div>

      <div style={styles.stepper}>
        {ETAPES.map((e, i) => (
          <div key={e.id} style={styles.stepperItem}>
            <div style={{
              ...styles.stepCircle,
              background: etape >= e.id ? '#2563eb' : '#e5e7eb',
              color: etape >= e.id ? '#fff' : '#9ca3af'
            }}>
              {etape > e.id ? '✓' : e.id}
            </div>
            <span style={{
              ...styles.stepLabel,
              color: etape >= e.id ? '#2563eb' : '#9ca3af',
              fontWeight: etape === e.id ? 700 : 400
            }}>{e.label}</span>
            {i < ETAPES.length - 1 && (
              <div style={{
                ...styles.stepLine,
                background: etape > e.id ? '#2563eb' : '#e5e7eb'
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {error && <div style={styles.errorBox}>{error}</div>}

        {etape === 1 && (
          <div>
            <h2 style={styles.etapeTitle}>Votre identité</h2>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Prénom *</label>
                <input style={styles.input} value={form.fname}
                  onChange={e => set('fname', e.target.value)} placeholder="Mohamed" />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Nom *</label>
                <input style={styles.input} value={form.lname}
                  onChange={e => set('lname', e.target.value)} placeholder="Benali" />
              </div>
            </div>
            <label style={styles.label}>Genre</label>
            <div style={styles.radioGroup}>
              {['Masculin', 'Féminin'].map(g => (
                <label key={g} style={styles.radioLabel}>
                  <input type="radio" name="gender" value={g}
                    checked={form.gender === g} onChange={() => set('gender', g)} />
                  {g}
                </label>
              ))}
            </div>
            <label style={styles.label}>Téléphone *</label>
            <input style={styles.input} value={form.telephone}
              onChange={e => set('telephone', e.target.value)} placeholder="0550 123 456" />
          </div>
        )}

        {etape === 2 && (
          <div>
            <h2 style={styles.etapeTitle}>Votre spécialité</h2>
            <label style={styles.label}>Spécialité *</label>
            <select style={styles.input} value={form.specialite}
              onChange={e => set('specialite', e.target.value)}>
              <option value="">-- Choisir --</option>
              {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={styles.label}>Sous-spécialité (optionnel)</label>
            <input style={styles.input} value={form.sous_specialite}
              onChange={e => set('sous_specialite', e.target.value)}
              placeholder="Ex: Cardiologie interventionnelle" />
            <label style={styles.label}>N° d'ordre professionnel (optionnel)</label>
            <input style={styles.input} value={form.numero_ordre}
              onChange={e => set('numero_ordre', e.target.value)} placeholder="12345" />
            <label style={styles.label}>Langues parlées</label>
            <div style={styles.checkGroup}>
              {LANGUES.map(l => (
                <label key={l} style={styles.checkLabel}>
                  <input type="checkbox" checked={form.langues.includes(l)}
                    onChange={() => toggleLangue(l)} />
                  {l}
                </label>
              ))}
            </div>
          </div>
        )}

        {etape === 3 && (
          <div>
            <h2 style={styles.etapeTitle}>Votre cabinet</h2>
            <label style={styles.label}>Wilaya *</label>
            <select style={styles.input} value={form.wilaya}
              onChange={e => set('wilaya', e.target.value)}>
              <option value="">-- Choisir --</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <label style={styles.label}>Adresse du cabinet *</label>
            <input style={styles.input} value={form.adresse}
              onChange={e => set('adresse', e.target.value)}
              placeholder="12 rue des Martyrs, Alger" />
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Tarif (DA)</label>
                <input style={styles.input} type="number" min="0" value={form.tarif}
                  onChange={e => set('tarif', e.target.value)} />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Durée RDV (min)</label>
                <select style={styles.input} value={form.duree_rdv}
                  onChange={e => set('duree_rdv', e.target.value)}>
                  {[15, 20, 30, 45, 60].map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
            <label style={styles.label}>Bio (optionnel)</label>
            <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }}
              value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="Présentez-vous en quelques mots..." />
          </div>
        )}

        {etape === 4 && (
          <div>
            <h2 style={styles.etapeTitle}>Récapitulatif</h2>
            <div style={styles.recapGrid}>
              <RecapItem label="Nom" value={`${form.fname} ${form.lname}`} />
              <RecapItem label="Téléphone" value={form.telephone} />
              <RecapItem label="Spécialité" value={form.specialite} />
              <RecapItem label="Wilaya" value={form.wilaya} />
              <RecapItem label="Adresse" value={form.adresse} />
              <RecapItem label="Tarif" value={`${form.tarif} DA`} />
              <RecapItem label="Durée RDV" value={`${form.duree_rdv} min`} />
              <RecapItem label="Langues" value={form.langues.join(', ')} />
            </div>
            <p style={styles.infoNote}>
              ℹ️ Votre profil sera visible dès validation par notre équipe.
            </p>
          </div>
        )}

        <div style={styles.navButtons}>
          {etape > 1 && (
            <button style={styles.btnSecondary} onClick={() => setEtape(e => e - 1)}>
              ← Retour
            </button>
          )}
          {etape < 4 && (
            <button style={styles.btnPrimary} onClick={validerEtape}>
              Continuer →
            </button>
          )}
          {etape === 4 && (
            <button style={styles.btnPrimary} onClick={soumettre} disabled={loading}>
              {loading ? 'Enregistrement...' : '✓ Finaliser mon profil'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RecapItem({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: '#6b7280', display: 'block' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{value || '—'}</span>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: { fontSize: 24, fontWeight: 800, color: '#1e40af', marginBottom: 4 },
  subtitle: { color: '#6b7280', fontSize: 14, margin: 0 },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 0 },
  stepperItem: { display: 'flex', alignItems: 'center', gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  stepLabel: { fontSize: 12, whiteSpace: 'nowrap' },
  stepLine: { width: 32, height: 2, margin: '0 6px' },
  card: { maxWidth: 520, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  etapeTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20, marginTop: 0 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fafafa' },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1 },
  radioGroup: { display: 'flex', gap: 20, marginTop: 8 },
  radioLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' },
  checkGroup: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' },
  navButtons: { display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 },
  btnPrimary: { flex: 1, padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: '12px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  errorBox: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
  recapGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  infoNote: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginTop: 16 }
}