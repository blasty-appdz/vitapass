import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import DoctorShell, { Loader, fullName, ageOf } from './DoctorShell'
import { formatDate } from '../../utils/formatters'

// Liste des patients qui ont partagé leur dossier avec le médecin (accès actif uniquement)
export default function DoctorDashboard({ nav, pro, userId }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = async () => {
      const { data: accesses } = await supabase
        .from('doctor_access')
        .select('id, access_level, granted_at, patient_id')
        .eq('doctor_id', userId)
        .eq('status', 'active')
      const ids = (accesses || []).map(a => a.patient_id)
      let profiles = []
      if (ids.length > 0) {
        const { data } = await supabase.from('profiles').select('id, fname, lname, dob, blood, gender').in('id', ids)
        profiles = data || []
      }
      if (cancelled) return
      setPatients((accesses || []).map(a => ({ ...a, patient: profiles.find(p => p.id === a.patient_id) || null })))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const q = search.trim().toLowerCase()
  const filtered = patients.filter(a => fullName(a.patient).toLowerCase().includes(q))
  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''

  return (
    <DoctorShell nav={nav} active="pro-patients" who={who} title="Mes patients"
      subtitle={`${patients.length} patient${patients.length > 1 ? 's' : ''} vous ${patients.length > 1 ? 'ont' : 'a'} donné accès à son dossier`}>

      {!pro?.validated && (
        <div className="pro-banner info">{"⏳"} Tant que votre profil n'est pas validé, les patients ne peuvent pas vous donner accès à leur dossier.</div>
      )}

      <input className="form-input" placeholder="🔍 Rechercher un patient…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14 }} />

      {loading ? <Loader /> : filtered.length === 0 ? (
        <div className="pro-card pro-empty">
          <div className="e">{"🏥"}</div>
          {search ? 'Aucun patient trouvé' : 'Aucun patient ne vous a encore donné accès à son dossier.'}
          {!search && (
            <div style={{ marginTop: 10, lineHeight: 1.6 }}>
              Le patient vous ajoute depuis son application (menu « Mes médecins ») avec votre adresse e-mail VitaPass.
            </div>
          )}
        </div>
      ) : filtered.map(a => {
        const p = a.patient
        const age = ageOf(p?.dob)
        return (
          <div key={a.id} className="pro-card pro-row" style={{ cursor: 'pointer' }}
            onClick={() => nav('pro-patient', { patientId: a.patient_id })}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,201,141,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {p?.gender === 'Féminin' ? '👩' : '👨'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{fullName(p)}</div>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 3 }}>
                {age !== null ? `${age} ans · ` : ''}Accès depuis le {formatDate(a.granted_at)}
              </div>
            </div>
            {p?.blood && <span className="badge badge-r">{"🩸"} {p.blood}</span>}
            <span style={{ color: 'var(--dim)', fontSize: 18 }}>›</span>
          </div>
        )
      })}
    </DoctorShell>
  )
}
