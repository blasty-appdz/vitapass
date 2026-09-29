import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import DoctorShell, { Loader, fullName } from './DoctorShell'
import Icon from '../../components/common/Icon'

// Mon secrétariat : le médecin ajoute ses secrétaires (par e-mail) et choisit,
// dossier par dossier, ceux qu'elles peuvent consulter (lecture seule).
export default function ProfessionalSecretaries({ nav, showToast, pro, userId }) {
  const [loading, setLoading] = useState(true)
  const [secretaries, setSecretaries] = useState([]) // [{ id, fname, lname, since }]
  const [patients, setPatients] = useState([]) // [{ id, fname, lname }]
  const [grants, setGrants] = useState([]) // [{ secretary_id, patient_id }]
  const [open, setOpen] = useState(null)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    const [{ data: links }, { data: accesses }, { data: spa }] = await Promise.all([
      supabase.from('doctor_secretaries').select('secretary_id, created_at').eq('doctor_id', userId).eq('status', 'active'),
      supabase.from('doctor_access').select('patient_id').eq('doctor_id', userId).eq('status', 'active'),
      supabase.from('secretary_patient_access').select('secretary_id, patient_id').eq('doctor_id', userId),
    ])
    const secIds = (links || []).map(l => l.secretary_id)
    const patIds = (accesses || []).map(a => a.patient_id)
    const ids = [...secIds, ...patIds]
    let profs = []
    if (ids.length > 0) {
      const { data } = await supabase.from('profiles').select('id, fname, lname').in('id', ids)
      profs = data || []
    }
    setSecretaries((links || []).map(l => ({ ...(profs.find(p => p.id === l.secretary_id) || { id: l.secretary_id }), since: l.created_at })))
    setPatients(patIds.map(id => profs.find(p => p.id === id) || { id }).sort((a, b) => fullName(a).localeCompare(fullName(b))))
    setGrants(spa || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const addSecretary = async () => {
    const e = email.trim().toLowerCase()
    if (!e) { showToast('Saisissez l\'e-mail de la secrétaire'); return }
    setAdding(true)
    const { data, error } = await supabase.rpc('add_secretary_by_email', { p_email: e })
    setAdding(false)
    if (error) {
      const m = (error.message || '').toLowerCase()
      if (m.includes('aucun compte')) showToast('Aucun compte secrétaire avec cet e-mail. Elle doit d\'abord créer son compte VitaPass en choisissant « Secrétaire médicale ».')
      else if (m.includes('médecins validés')) showToast('Votre profil doit être validé pour ajouter une secrétaire')
      else showToast('❌ ' + error.message)
      return
    }
    const s = Array.isArray(data) ? data[0] : data
    showToast(`✅ ${fullName(s)} ajoutée à votre secrétariat`)
    setEmail('')
    await load()
    if (s?.id) setOpen(s.id)
  }

  const removeSecretary = async (s) => {
    if (!confirm(`Retirer ${fullName(s)} de votre secrétariat ? Elle perdra immédiatement l'accès à tous les dossiers.`)) return
    setBusy(s.id)
    const { error } = await supabase.rpc('remove_secretary', { p_secretary: s.id })
    setBusy('')
    if (error) { showToast('❌ ' + error.message); return }
    showToast('Accès retiré')
    setOpen(null)
    load()
  }

  const hasGrant = (secId, patId) => grants.some(g => g.secretary_id === secId && g.patient_id === patId)

  const toggle = async (secId, patId) => {
    const key = secId + patId
    setBusy(key)
    const { error } = hasGrant(secId, patId)
      ? await supabase.from('secretary_patient_access').delete().eq('doctor_id', userId).eq('secretary_id', secId).eq('patient_id', patId)
      : await supabase.from('secretary_patient_access').insert({ doctor_id: userId, secretary_id: secId, patient_id: patId })
    setBusy('')
    if (error) { showToast('❌ ' + error.message); return }
    load()
  }

  const setAll = async (secId, on) => {
    if (on && patients.every(p => hasGrant(secId, p.id))) return
    setBusy(secId + 'all')
    const { error } = on
      ? await supabase.from('secretary_patient_access').upsert(
          patients.filter(p => !hasGrant(secId, p.id)).map(p => ({ doctor_id: userId, secretary_id: secId, patient_id: p.id })),
          { onConflict: 'doctor_id,secretary_id,patient_id', ignoreDuplicates: true })
      : await supabase.from('secretary_patient_access').delete().eq('doctor_id', userId).eq('secretary_id', secId)
    setBusy('')
    if (error) { showToast('❌ ' + error.message); return }
    load()
  }

  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''

  return (
    <DoctorShell nav={nav} active="pro-dashboard" who={who} title="Mon secrétariat"
      subtitle="Vos secrétaires consultent uniquement les dossiers que vous leur confiez, en lecture seule.">

      <button className="pro-btn ghost" style={{ marginBottom: 14 }} onClick={() => nav('pro-dashboard')}>
        <Icon name="chevronLeft" size={16} /> Accueil
      </button>

      {!pro?.validated && (
        <div className="pro-banner info"><Icon e="⏳" /> Votre profil doit être validé par l'équipe VitaPass avant d'ajouter une secrétaire.</div>
      )}

      <div className="pro-card">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Ajouter une secrétaire</div>
        <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 10, lineHeight: 1.5 }}>
          Elle crée d'abord son compte VitaPass (choix « Secrétaire médicale »), puis vous saisissez ici son e-mail.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" type="email" placeholder="secretaire@exemple.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSecretary()} style={{ flex: 1, marginBottom: 0 }} />
          <button className="pro-btn g" onClick={addSecretary} disabled={adding || !pro?.validated}>
            {adding ? '…' : <><Icon name="plus" size={16} /> Ajouter</>}
          </button>
        </div>
      </div>

      {loading ? <Loader /> : secretaries.length === 0 ? (
        <div className="pro-card pro-empty"><div className="e"><Icon e="👥" /></div>Aucune secrétaire pour le moment.</div>
      ) : secretaries.map(s => {
        const count = grants.filter(g => g.secretary_id === s.id).length
        const isOpen = open === s.id
        return (
          <div key={s.id} className="pro-card">
            <div className="pro-row" style={{ cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : s.id)}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,201,141,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon e="📋" size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{fullName(s)}</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 3 }}>
                  {count} dossier{count > 1 ? 's' : ''} confié{count > 1 ? 's' : ''} sur {patients.length}
                </div>
              </div>
              <span style={{ color: 'var(--dim)', fontSize: 18 }}>{isOpen ? '▾' : '›'}</span>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {patients.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--dim)' }}>Aucun patient ne vous a encore donné accès à son dossier.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <button className="pro-btn ghost" style={{ flex: 1 }} disabled={!!busy} onClick={() => setAll(s.id, true)}>Tout cocher</button>
                      <button className="pro-btn ghost" style={{ flex: 1 }} disabled={!!busy} onClick={() => setAll(s.id, false)}>Tout décocher</button>
                    </div>
                    {patients.map(p => {
                      const on = hasGrant(s.id, p.id)
                      return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: '1px solid var(--border)', cursor: 'pointer', opacity: busy === s.id + p.id ? 0.5 : 1 }}>
                          <input type="checkbox" checked={on} disabled={!!busy} onChange={() => toggle(s.id, p.id)}
                            style={{ width: 18, height: 18, accentColor: 'var(--g)' }} />
                          <span style={{ flex: 1, fontSize: 14 }}>{fullName(p)}</span>
                          {on && <span style={{ fontSize: 12, color: 'var(--g)' }}>Accès</span>}
                        </label>
                      )
                    })}
                  </>
                )}
                <button className="pro-btn red" style={{ width: '100%', marginTop: 12 }} disabled={busy === s.id} onClick={() => removeSecretary(s)}>
                  <Icon e="🚪" /> Retirer cette secrétaire
                </button>
              </div>
            )}
          </div>
        )
      })}
    </DoctorShell>
  )
}
