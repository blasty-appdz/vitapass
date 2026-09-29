import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { useOffline } from '../../hooks/useOffline'
import { openDocument, hasDocumentFile } from '../../services/documents'
import { formatDate } from '../../utils/formatters'
import DoctorShell, { Loader, fullName, ageOf } from './DoctorShell'
import Icon, { IconText, splitLeadingEmoji } from '../../components/common/Icon'
const arr = (v) => (Array.isArray(v) ? v : [])
const label = (x) => (typeof x === 'string' ? x : x?.name || '')
const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '')
const waHref = (p) => {
  let d = String(p).replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = '213' + d.slice(1)
  return 'https://wa.me/' + d
}

// mode 'doctor' : espace médecin (notes + gestion du secrétariat)
// mode 'secretary' : lecture seule, accès contrôlé côté base (RLS)
export default function PatientRecord({ nav, showToast, patientId, pro, userId, mode = 'doctor', shell = {}, backTo = 'pro-patients', backLabel = 'Mes patients' }) {
  const isSecretary = mode === 'secretary'
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
  const [secretaries, setSecretaries] = useState([])
  const [secGrants, setSecGrants] = useState([])
  const [secBusy, setSecBusy] = useState('')

  const fetchAll = useCallback(async () => {
    if (!patientId || !userId) return
    if (isOffline) { setState('offline'); return }
    setState('loading')
    if (!isSecretary) {
      const { data: access } = await supabase
        .from('doctor_access')
        .select('id')
        .eq('doctor_id', userId)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .limit(1)
      if (!access || access.length === 0) { setState('denied'); return }
      loadSecretariat()
    }

    const [{ data: prof }, { data: dos }, { data: docs }] = await Promise.all([
      supabase.from('profiles').select('id, fname, lname, dob, gender, blood, wilaya, cnas, emergency, phone').eq('id', patientId).maybeSingle(),
      supabase.from('dossiers').select('meds, allergies, antecedents, vaccins, glyc, bp, weight, updated_at').eq('patient_id', patientId).maybeSingle(),
      supabase.from('documents').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    ])
    setPatient(prof)
    setDossier(dos)
    setDocuments(docs || [])
    setState(dos || prof ? 'ok' : 'denied')
  }, [patientId, userId, isOffline, isSecretary]) // eslint-disable-line react-hooks/exhaustive-deps

  // Secrétaires du médecin et celles qui ont accès à CE dossier
  const loadSecretariat = async () => {
    const [{ data: links }, { data: spa }] = await Promise.all([
      supabase.from('doctor_secretaries').select('secretary_id').eq('doctor_id', userId).eq('status', 'active'),
      supabase.from('secretary_patient_access').select('secretary_id').eq('doctor_id', userId).eq('patient_id', patientId),
    ])
    const ids = (links || []).map(l => l.secretary_id)
    let profs = []
    if (ids.length > 0) {
      const { data } = await supabase.from('profiles').select('id, fname, lname').in('id', ids)
      profs = data || []
    }
    setSecretaries(ids.map(id => profs.find(p => p.id === id) || { id }))
    setSecGrants((spa || []).map(g => g.secretary_id))
  }

  const toggleSecretary = async (secId) => {
    setSecBusy(secId)
    const on = secGrants.includes(secId)
    const { error } = on
      ? await supabase.from('secretary_patient_access').delete().eq('doctor_id', userId).eq('secretary_id', secId).eq('patient_id', patientId)
      : await supabase.from('secretary_patient_access').insert({ doctor_id: userId, secretary_id: secId, patient_id: patientId })
    setSecBusy('')
    if (error) { showToast('❌ ' + error.message); return }
    showToast(on ? 'Accès secrétaire retiré' : '✅ Accès secrétaire accordé')
    loadSecretariat()
  }

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

  const who = shell.who !== undefined ? shell.who : (pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : '')
  const shellProps = { nav, active: shell.active || 'pro-patients', who, items: shell.items, badge: shell.badge, hideNav: !!shell.hideNav }
  const back = (
    <button className="pro-btn ghost" style={{ marginBottom: 14 }} onClick={() => nav(backTo)}><Icon name="chevronLeft" size={16} /> {backLabel}</button>
  )

  if (state === 'loading') return <DoctorShell {...shellProps}>{back}<Loader label="Chargement du dossier…" /></DoctorShell>
  if (state === 'offline') return (
    <DoctorShell {...shellProps}>{back}
      <div className="pro-card pro-empty"><div className="e"><Icon e="📴" /></div>Dossier indisponible hors connexion.</div>
    </DoctorShell>
  )
  if (state === 'denied') return (
    <DoctorShell {...shellProps}>{back}
      <div className="pro-card pro-empty">
        <div className="e"><Icon e="🔒" /></div>
        {isSecretary ? 'Ce dossier ne vous est pas (ou plus) confié par le médecin.' : 'Ce patient ne vous a pas (ou plus) donné accès à son dossier.'}
        {!isSecretary && <div style={{ marginTop: 8 }}>Il peut vous l'accorder depuis son application, menu « Mes médecins ».</div>}
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
    <DoctorShell {...shellProps}>
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

      {patient?.phone && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <a href={telHref(patient.phone)} className="pro-btn g" style={{ flex: 1, textDecoration: 'none', padding: '12px 14px' }}><Icon name="phone" size={17} /> Appeler</a>
          <a href={waHref(patient.phone)} target="_blank" rel="noreferrer" className="pro-btn ghost" style={{ flex: 1, textDecoration: 'none', padding: '12px 14px' }}><Icon name="message" size={17} /> WhatsApp</a>
        </div>
      )}
      {patient?.emergency && (
        <a href={telHref(patient.emergency)} className="pro-banner info" style={{ textDecoration: 'none', flexWrap: 'nowrap' }}><Icon e="📞" /><span style={{ minWidth: 0 }}>Urgence : <b>{patient.emergency}</b></span><span style={{ marginLeft: 'auto', fontWeight: 600, flexShrink: 0 }}>Appeler</span></a>
      )}

      {isSecretary && (
        <div className="pro-banner info"><Icon e="🔒" /> Consultation seule — dossier confié par le médecin.</div>
      )}

      {!isSecretary && secretaries.length > 0 && (
        <div className="pro-card">
          <div style={{ fontWeight: 700, marginBottom: 4 }}><Icon e="📋" /> Accès secrétariat</div>
          <div style={{ fontSize: 12.5, color: 'var(--dim)', marginBottom: 8 }}>Cochez les secrétaires qui peuvent consulter ce dossier.</div>
          {secretaries.map(sec => (
            <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', cursor: 'pointer', opacity: secBusy === sec.id ? 0.5 : 1 }}>
              <input type="checkbox" checked={secGrants.includes(sec.id)} disabled={!!secBusy} onChange={() => toggleSecretary(sec.id)}
                style={{ width: 18, height: 18, accentColor: 'var(--g)' }} />
              <span style={{ fontSize: 14 }}>{fullName(sec)}</span>
            </label>
          ))}
        </div>
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
          {!isSecretary && (
            <button className="pro-btn g" style={{ width: '100%', marginBottom: 12 }} onClick={() => setShowNote(true)}>
              <Icon name="plus" size={17} /> Ajouter une note médicale
            </button>
          )}
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

      {showNote && !isSecretary && (
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
      <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: danger ? '#FF9A9A' : 'var(--white)' }}><span style={{ color: danger ? 'var(--red)' : 'var(--g)', display: 'flex' }}><Icon e={splitLeadingEmoji(title).emoji} size={18} /></span>{splitLeadingEmoji(title).text}</div>
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
