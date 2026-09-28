import { useState } from 'react'
import { supabase } from '../../supabase'
import { WILAYAS, SPECIALITES, LANGUES } from '../../data'
import DoctorShell from './DoctorShell'
import Icon, { IconText } from '../../components/common/Icon'
// Profil professionnel : création (première connexion) et modification ensuite.
export default function ProfessionalOnboarding({ nav, showToast, pro, setPro, userId }) {
  const firstTime = !pro?.fname || !pro?.specialite || !pro?.wilaya
  const [form, setForm] = useState({
    fname: pro?.fname || '',
    lname: pro?.lname || '',
    gender: pro?.gender || 'Masculin',
    telephone: pro?.telephone || '',
    specialite: SPECIALITES.includes(pro?.specialite) ? pro.specialite : '',
    sous_specialite: pro?.sous_specialite || '',
    numero_ordre: pro?.numero_ordre || '',
    wilaya: pro?.wilaya || '',
    adresse: pro?.adresse || '',
    tarif: pro?.tarif ?? 2000,
    duree_rdv: pro?.duree_rdv || 30,
    langues: Array.isArray(pro?.langues) && pro.langues.length ? pro.langues : ['ar', 'fr'],
    bio: pro?.bio || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleLangue = (code) => setForm(f => ({
    ...f,
    langues: f.langues.includes(code) ? f.langues.filter(l => l !== code) : [...f.langues, code],
  }))

  const save = async () => {
    setError('')
    if (!form.fname.trim() || !form.lname.trim()) return setError('Prénom et nom requis')
    if (!form.telephone.trim()) return setError('Téléphone du cabinet requis')
    if (!form.specialite) return setError('Spécialité requise')
    if (!form.wilaya) return setError('Wilaya requise')
    if (!form.adresse.trim()) return setError('Adresse du cabinet requise')
    if (form.langues.length === 0) return setError('Choisissez au moins une langue')

    setSaving(true)
    const data = {
      id: userId,
      fname: form.fname.trim(),
      lname: form.lname.trim(),
      gender: form.gender,
      telephone: form.telephone.trim(),
      specialite: form.specialite,
      sous_specialite: form.sous_specialite.trim() || null,
      numero_ordre: form.numero_ordre.trim() || null,
      wilaya: form.wilaya,
      adresse: form.adresse.trim(),
      tarif: Number(form.tarif) || null,
      duree_rdv: Number(form.duree_rdv) || 30,
      langues: form.langues,
      bio: form.bio.trim() || null,
      updated_at: new Date().toISOString(),
    }
    // upsert : fonctionne même si la fiche professionnelle n'a pas été créée à l'inscription
    const { data: saved, error: err } = await supabase
      .from('professionals')
      .upsert(data, { onConflict: 'id' })
      .select('*')
      .maybeSingle()
    if (err) { setSaving(false); setError(err.message); return }

    // Nom et spécialité aussi dans le profil (affichés au patient dans « Mes médecins »)
    await supabase.from('profiles').update({
      fname: data.fname, lname: data.lname, gender: data.gender,
      specialite: data.specialite, numero_ordre: data.numero_ordre, wilaya: data.wilaya,
    }).eq('id', userId)

    setSaving(false)
    setPro(saved || { ...pro, ...data })
    showToast('✅ Profil enregistré')
    nav(firstTime ? 'pro-schedule' : 'pro-dashboard')
  }

  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''

  return (
    <DoctorShell nav={nav} active="pro-onboarding" who={who}
      title={firstTime ? 'Créez votre profil professionnel' : 'Mon profil professionnel'}
      subtitle={firstTime ? 'Ces informations permettent aux patients de vous trouver et de réserver.' : 'Informations visibles par les patients.'}>

      {pro && (
        <div className={`pro-banner ${pro.validated ? 'info' : 'warn'}`}>
          <IconText>{pro.validated ? '✅ Profil validé par VitaPass' : '⏳ Profil en attente de validation par l\'équipe VitaPass'}</IconText>
        </div>
      )}

      <div className="pro-card">
        <div className="sec-label" style={{ marginTop: 0 }}>Identité</div>
        <div className="form-row">
          <Field label="Prénom *"><input className="form-input" value={form.fname} onChange={e => set('fname', e.target.value)} placeholder="Mohamed" /></Field>
          <Field label="Nom *"><input className="form-input" value={form.lname} onChange={e => set('lname', e.target.value)} placeholder="Benali" /></Field>
        </div>
        <div className="form-row">
          <Field label="Genre">
            <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="Masculin">Homme</option>
              <option value="Féminin">Femme</option>
            </select>
          </Field>
          <Field label="Téléphone du cabinet *"><input className="form-input" type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="0550 12 34 56" /></Field>
        </div>
      </div>

      <div className="pro-card">
        <div className="sec-label" style={{ marginTop: 0 }}>Activité</div>
        <Field label="Spécialité *">
          <select className="form-select" value={form.specialite} onChange={e => set('specialite', e.target.value)}>
            <option value="">— Choisir —</option>
            {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Sous-spécialité"><input className="form-input" value={form.sous_specialite} onChange={e => set('sous_specialite', e.target.value)} placeholder="Optionnel" /></Field>
          <Field label="N° d'ordre"><input className="form-input" value={form.numero_ordre} onChange={e => set('numero_ordre', e.target.value)} placeholder="Optionnel" /></Field>
        </div>
        <Field label="Langues parlées *">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LANGUES.map(l => {
              const on = form.langues.includes(l.code)
              return (
                <button key={l.code} type="button" className={`pro-btn ${on ? 'g' : 'ghost'}`} onClick={() => toggleLangue(l.code)}>
                  {on && <Icon name="check" size={14} />}{l.label}
                </button>
              )
            })}
          </div>
        </Field>
      </div>

      <div className="pro-card">
        <div className="sec-label" style={{ marginTop: 0 }}>Cabinet</div>
        <Field label="Wilaya *">
          <select className="form-select" value={form.wilaya} onChange={e => set('wilaya', e.target.value)}>
            <option value="">— Choisir —</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </Field>
        <Field label="Adresse du cabinet *"><input className="form-input" value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="12 rue Larbi Ben M'hidi, Oran" /></Field>
        <div className="form-row">
          <Field label="Tarif consultation (DA)"><input className="form-input" type="number" min="0" value={form.tarif} onChange={e => set('tarif', e.target.value)} /></Field>
          <Field label="Durée d'un RDV">
            <select className="form-select" value={form.duree_rdv} onChange={e => set('duree_rdv', Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </Field>
        </div>
        <Field label="Présentation">
          <textarea className="form-input" rows={4} value={form.bio} onChange={e => set('bio', e.target.value)}
            placeholder="Présentez-vous en quelques mots…" style={{ resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
      </div>

      {error && <div className="error-msg"><Icon e="⚠️" /> {error}</div>}
      <button className="btn-submit" onClick={save} disabled={saving}>
        {saving ? 'Enregistrement…' : firstTime ? 'Enregistrer et ouvrir mes créneaux' : 'Enregistrer'}
      </button>
    </DoctorShell>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-group" style={{ flex: 1 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}
