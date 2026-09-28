import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { useOffline } from '../../hooks/useOffline'
import { openDocument, hasDocumentFile } from '../../services/documents'
import { formatDate } from '../../utils/formatters'
import DoctorShell, { Loader, fullName, ageOf } from './DoctorShell'
import Icon, { IconText } from '../../components/common/Icon'
const arr = (v) => (Array.isArray(v) ? v : [])
const label = (x) => (typeof x === 'string' ? x : x?.name || '')

export default function PatientRecord({ nav, showToast, patientId, pro, userId }) {
  const { isOffline } = useOffline()
  const [state, setState] = useState('loading') // loading | ok | denied | offline
  const [patient, setPatient] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [documents, setDocuments] = useState([])
  const [tab, setTab] = useState('dossier')
  const [showNote, setShowNote] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!patientId || !userId) return
    if (isOffline) { setState('offline'); return }
    setState('loading')
    const { data: access } = await supabase
      .from('doctor_access')
      .select('id')
      .eq('doctor_id', userId)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .limit(1)
    if (!access || access.length === 0) { setState('denied'); return }

    const [{ data: prof }, { data: dos }, { data: docs }] = await Promise.all([
      supabase.from('profiles').select('id, fname, lname, dob, gender, blood, wilaya, cnas, emergency').eq('id', patientId).maybeSingle(),
      supabase.from('dossiers').select('meds, allergies, antecedents, vaccins, glyc, bp, weight, updated_at').eq('patient_id', patientId).maybeSingle(),
      supabase.from('documents').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    ])
    setPatient(prof)
    setDossier(dos)
    setDocuments(docs || [])
    setState(dos || prof ? 'ok' : 'denied')
  }, [patientId, userId, isOffline])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) { showToast('Titre et contenu requis'); return }
    setSaving(true)
    const { error } = await supabase.from('documents').insert({
      patient_id: patientId,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      type: 'note_medecin',
      medecin: pro?.fname ? `${pro.fname} ${pro.lname || ''}`.trim() : null,
      date: new Date().toISOString().slice(0, 10),
      created_by: userId,
    })
    setSaving(false)
    if (error) { showToast('❌ ' + error.message); return }
    showToast('✅ Note ajoutée au dossier')
    setNoteTitle(''); setNoteContent(''); setShowNote(false)
    fetchAll()
  }

  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''
  const back = (
    <button className="pro-btn ghost" style={{ marginBottom: 14 }} onClick={() => nav('pro-patients')}><Icon name="chevronLeft" size={16} /> Mes patients</button>
  )

  if (state === 'loading') return <DoctorShell nav={nav} active="pro-patients" who={who}>{back}<Loader label="Chargement du dossier…" /></DoctorShell>
  if (state === 'offline') return (
    <DoctorShell nav={nav} active="pro-patients" who={who}>{back}
      <div className="pro-card pro-empty"><div className="e"><Icon e="📴" /></div>Dossier indisponible hors connexion.</div>
    </DoctorShell>
  )
  if (state === 'denied') return (
    <DoctorShell nav={nav} active="pro-patients" who={who}>{back}
      <div className="pro-card pro-empty">
        <div className="e"><Icon e="🔒" /></div>
        Ce patient ne vous a pas (ou plus) donné accès à son dossier.
        <div style={{ marginTop: 8 }}>Il peut vous l'accorder depuis son application, menu « Mes médecins ».</div>
      </div>
    </DoctorShell>
  )

  const age = ageOf(patient?.dob)
  const meds = arr(dossier?.meds)
  const allergies = arr(dossier?.allergies)
  const antecedents = arr(dossier?.antecedents)
  const vaccins = arr(dossier?.vaccins)
  const glyc = arr(dossier?.glyc)
  const bp = arr(dossier?.bp)
  const weight = arr(dossier?.weight)
  const last = (a) => (a.length ? a[a.length - 1] : null)

  return (
    <DoctorShell nav={nav} active="pro-patients" who={who}>
      {back}

      <div className="pro-card pro-row">
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(0,201,141,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
          <Icon name="user" size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{fullName(patient)}</div>
          <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {age !== null && <span><Icon e="🎂" /> {age} ans</span>}
            {patient?.wilaya && <span><Icon e="📍" /> {patient.wilaya}</span>}
            {patient?.cnas && <span>CNAS {patient.cnas}</span>}
          </div>
        </div>
        {patient?.blood && <span className="badge badge-r" style={{ fontSize: 13 }}><Icon e="🩸" /> {patient.blood}</span>}
      </div>

      {patient?.emergency && (
        <div className="pro-banner info"><Icon e="📞" /> Contact d'urgence : <b>{patient.emergency}</b></div>
      )}

      <div className="pro-seg">
        <button className={tab === 'dossier' ? 'on' : ''} onClick={() => setTab('dossier')}><Icon e="📋" /> Dossier</button>
        <button className={tab === 'docs' ? 'on' : ''} onClick={() => setTab('docs')}><Icon e="📄" /> Documents ({documents.length})</button>
      </div>

      {tab === 'dossier' && (
        <>
          <Block title="⚠️ Allergies" empty="Aucune allergie déclarée" items={allergies.map(a => label(a))} danger />
          <Block title="💊 Traitements en cours" empty="Aucun traitement déclaré"
            items={meds.map(m => [label(m), m?.dose, m?.reason].filter(Boolean).join(' · '))} />
          <Block title="🩺 Antécédents" empty="Aucun antécédent déclaré"
            items={antecedents.map(a => [label(a), a?.type, a?.year].filter(Boolean).join(' · '))} />
          <Block title="💉 Vaccins" empty="Aucun vaccin renseigné"
            items={vaccins.map(v => `${label(v)} — ${v?.status === 'pending' ? 'à faire' : v?.date ? formatDate(v.date) : 'fait'}`)} />
          <div className="pro-card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}><Icon e="📊" /> Suivi</div>
            <Metric name="Glycémie (HbA1c)" value={last(glyc)} unit="%" history={glyc} />
            <Metric name="Tension" value={last(bp) ? `${last(bp).s}/${last(bp).d}` : null} unit="mmHg" history={bp.map(x => `${x.s}/${x.d}`)} />
            <Metric name="Poids" value={last(weight)} unit="kg" history={weight} />
          </div>
          {dossier?.updated_at && (
            <div style={{ fontSize: 12.5, color: 'var(--dim)', textAlign: 'center' }}>Dossier mis à jour le {formatDate(dossier.updated_at)}</div>
          )}
        </>
      )}

      {tab === 'docs' && (
        <>
          <button className="pro-btn g" style={{ width: '100%', marginBottom: 12 }} onClick={() => setShowNote(true)}>
            <Icon name="plus" size={17} /> Ajouter une note médicale
          </button>
          {documents.length === 0 ? (
            <div className="pro-card pro-empty"><div className="e"><Icon e="📂" /></div>Aucun document pour ce patient.</div>
          ) : documents.map(doc => (
            <div key={doc.id} className="pro-card">
              <div className="pro-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{doc.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 3 }}>
                    <IconText>{doc.type === 'note_medecin' ? '📝 Note médecin' : '📄 ' + (doc.type || 'Document')}</IconText>
                    {' · '}{formatDate(doc.date || doc.created_at)}{doc.medecin ? ` · Dr. ${doc.medecin}` : ''}
                  </div>
                </div>
                {hasDocumentFile(doc) && (
                  <button className="pro-btn blue" onClick={() => openDocument(doc, (m) => showToast('❌ ' + m))}>Ouvrir</button>
                )}
              </div>
              {doc.content && <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10, whiteSpace: 'pre-wrap', color: 'rgba(239,243,255,.85)' }}>{doc.content}</p>}
            </div>
          ))}
        </>
      )}

      {showNote && (
        <div className="modal-overlay" style={{ position: 'fixed', zIndex: 200 }} onClick={e => e.target === e.currentTarget && setShowNote(false)}>
          <div className="modal" style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="modal-handle" />
            <div className="modal-title">Note médicale</div>
            <div className="form-group">
              <label className="form-label">Titre</label>
              <input className="form-input" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Consultation du jour" />
            </div>
            <div className="form-group">
              <label className="form-label">Contenu</label>
              <textarea className="form-input" rows={6} value={noteContent} onChange={e => setNoteContent(e.target.value)}
                placeholder="Observations, prescription, conduite à tenir…" style={{ resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            <button className="btn-submit" onClick={saveNote} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer la note'}</button>
            <button className="btn-cancel" onClick={() => setShowNote(false)}>Annuler</button>
          </div>
        </div>
      )}
    </DoctorShell>
  )
}

function Block({ title, items, empty, danger }) {
  const list = items.filter(Boolean)
  return (
    <div className="pro-card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {list.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--dim)' }}>{empty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map((t, i) => (
            <div key={i} style={{ fontSize: 13, padding: '8px 10px', borderRadius: 8, background: danger ? 'rgba(255,90,90,.08)' : 'rgba(255,255,255,.03)', color: danger ? '#FF8A8A' : 'var(--white)' }}>{t}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ name, value, unit, history }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--dim)' }}>{name}</span>
      <span style={{ fontSize: 13, textAlign: 'right' }}>
        {value !== null && value !== undefined ? <b>{value} {unit}</b> : <span style={{ color: 'var(--dim)' }}>—</span>}
        {history.length > 1 && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--dim)' }}>Historique : {history.slice(-5).join(' → ')}</span>}
      </span>
    </div>
  )
}
