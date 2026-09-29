import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import DoctorShell, { Loader, fullName, ageOf } from '../doctor/DoctorShell'
import Icon from '../../components/common/Icon'
import { SECRETARY_ITEMS } from './secretaryItems'


// Espace secrétaire : dossiers confiés par chaque médecin (lecture seule).
export default function SecretaryHome({ nav, profile, userId }) {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([]) // [{ doctor, patients: [] }]
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = async () => {
      const [{ data: links }, { data: spa }] = await Promise.all([
        supabase.from('doctor_secretaries').select('doctor_id').eq('secretary_id', userId).eq('status', 'active'),
        supabase.from('secretary_patient_access').select('doctor_id, patient_id').eq('secretary_id', userId),
      ])
      const docIds = (links || []).map(l => l.doctor_id)
      const patIds = [...new Set((spa || []).filter(g => docIds.includes(g.doctor_id)).map(g => g.patient_id))]
      const [{ data: docs }, { data: pats }] = await Promise.all([
        docIds.length ? supabase.from('professionals').select('id, fname, lname, specialite').in('id', docIds) : Promise.resolve({ data: [] }),
        // La base ne renvoie que les patients réellement accessibles (accès patient → médecin toujours actif)
        patIds.length ? supabase.from('profiles').select('id, fname, lname, dob, blood').in('id', patIds) : Promise.resolve({ data: [] }),
      ])
      if (cancelled) return
      setGroups(docIds.map(id => ({
        doctor: (docs || []).find(d => d.id === id) || { id },
        patients: (spa || [])
          .filter(g => g.doctor_id === id)
          .map(g => (pats || []).find(p => p.id === g.patient_id))
          .filter(Boolean)
          .sort((a, b) => fullName(a).localeCompare(fullName(b))),
      })))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const q = search.trim().toLowerCase()
  const total = groups.reduce((n, g) => n + g.patients.length, 0)
  const who = profile?.fname ? `${profile.fname} ${profile.lname || ''}`.trim() : ''

  return (
    <DoctorShell nav={nav} active="sec-home" who={who} items={SECRETARY_ITEMS} badge="Secrétariat" hideNav
      title="Dossiers confiés"
      subtitle={`${total} dossier${total > 1 ? 's' : ''} consultable${total > 1 ? 's' : ''} en lecture seule`}>

      {!loading && groups.length === 0 && (
        <div className="pro-card pro-empty">
          <div className="e"><Icon e="📋" /></div>
          Aucun médecin ne vous a encore ajoutée à son secrétariat.
          <div style={{ marginTop: 10, lineHeight: 1.6 }}>
            Communiquez à votre médecin l'adresse e-mail de ce compte : il vous ajoute depuis son espace, rubrique « Mon secrétariat », puis choisit les dossiers que vous pouvez consulter.
          </div>
        </div>
      )}

      {total > 5 && (
        <input className="form-input" placeholder="Rechercher un patient…" value={search}
          onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
      )}

      {loading ? <Loader /> : groups.map(g => {
        const list = g.patients.filter(p => fullName(p).toLowerCase().includes(q))
        return (
          <div key={g.doctor.id} style={{ marginBottom: 8 }}>
            <div className="sec-label">
              Dr. {`${g.doctor.fname || ''} ${g.doctor.lname || ''}`.trim() || 'Médecin'}{g.doctor.specialite ? ` · ${g.doctor.specialite}` : ''}
            </div>
            {list.length === 0 ? (
              <div className="pro-card" style={{ fontSize: 13, color: 'var(--dim)' }}>
                {q ? 'Aucun patient trouvé' : 'Aucun dossier ne vous est encore confié par ce médecin.'}
              </div>
            ) : list.map(p => {
              const age = ageOf(p.dob)
              return (
                <div key={g.doctor.id + p.id} className="pro-card pro-row" style={{ cursor: 'pointer' }}
                  onClick={() => nav('sec-patient', { patientId: p.id })}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,201,141,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="user" size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{fullName(p)}</div>
                    {age !== null && <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 3 }}>{age} ans</div>}
                  </div>
                  {p.blood && <span className="badge badge-r"><Icon e="🩸" /> {p.blood}</span>}
                  <span style={{ color: 'var(--dim)', fontSize: 18 }}>›</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </DoctorShell>
  )
}
