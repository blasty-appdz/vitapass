import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/formatters'

const DOC_TYPES = {
  ordonnance: { label: 'Ordonnance', icon: '💊' },
  analyse: { label: 'Analyse', icon: '🧪' },
  radio: { label: 'Radiologie', icon: '🩻' },
  compte_rendu: { label: 'Compte rendu', icon: '📋' },
  autre: { label: 'Autre', icon: '📄' },
}

export default function DossierScreen({ nav, dossier, onSave, showToast, isOffline }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('med')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [patientDocs, setPatientDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [docFile, setDocFile] = useState(null)
  const [docForm, setDocForm] = useState({ title: '', type: 'ordonnance', date: '', medecin: '' })
  const [docError, setDocError] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docInputRef = useRef(null)

  const meds = dossier?.meds || []
  const allergies = dossier?.allergies || []
  const antecedents = dossier?.antecedents || []
  const vaccins = dossier?.vaccins || [
    { id: 1, name: 'BCG', status: 'done', date: '1990-01-01' },
    { id: 2, name: 'Covid-19', status: 'done', date: '2021-06-15' },
    { id: 3, name: 'Grippe saisonnière', status: 'pending', date: null },
  ]

  useEffect(() => {
    if (activeTab === 'docs') loadDocs()
  }, [activeTab])

  const loadDocs = async () => {
    if (isOffline) return
    setDocsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
      if (error) console.error('Erreur chargement docs:', error.message)
      setPatientDocs(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setDocsLoading(false)
    }
  }

  const handleOpenDoc = (doc) => { if (doc.file_url) window.open(doc.file_url, '_blank') }

  const handleDeleteDoc = async (doc) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!confirm(t('common.delete') + ' ?')) return
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) { showToast('❌ ' + error.message); return }
    loadDocs()
    showToast('✅ ' + t('common.success'))
  }

  const handleUpload = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!docFile) { setDocError('Fichier requis'); return }
    if (!docForm.title.trim()) { setDocError('Nom requis'); return }
    setUploadingDoc(true)
    setDocError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = docFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, docFile)
      if (upErr) { setDocError(upErr.message); setUploadingDoc(false); return }
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      const { error: insErr } = await supabase.from('documents').insert({
        patient_id: user.id,
        title: docForm.title,
        type: docForm.type,
        date: docForm.date || null,
        medecin: docForm.medecin || null,
        file_url: publicUrl,
      })
      if (insErr) { setDocError(insErr.message); setUploadingDoc(false); return }
      setShowUploadModal(false)
      setDocFile(null)
      setDocForm({ title: '', type: 'ordonnance', date: '', medecin: '' })
      loadDocs()
      showToast('✅ ' + t('common.success'))
    } catch (e) {
      setDocError(e.message)
    } finally {
      setUploadingDoc(false)
    }
  }

  const addMed = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!form.name) return
    setSaving(true)
    await onSave({ meds: [...meds, { id: Date.now(), ...form }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅')
  }

  const addAllergy = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!form.name) return
    setSaving(true)
    await onSave({ allergies: [...allergies, { id: Date.now(), name: form.name }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅')
  }

  const removeAllergy = async (id) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    await onSave({ allergies: allergies.filter(a => a.id !== id) })
  }

  const addAnt = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!form.name) return
    setSaving(true)
    await onSave({ antecedents: [...antecedents, { id: Date.now(), ...form }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅')
  }

  const addVacc = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!form.name) return
    setSaving(true)
    await onSave({ vaccins: [...vaccins, { id: Date.now(), ...form }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅')
  }

  const tabs = [
    { id: 'med', label: '💊 ' + t('dossier.meds') },
    { id: 'allergy', label: '⚠️ ' + t('dossier.allergies') },
    { id: 'ant', label: '🩺 ' + t('dossier.antecedents') },
    { id: 'vacc', label: '💉 ' + t('dossier.vaccins') },
    { id: 'docs', label: '📄 ' + t('dossier.docs') },
  ]

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">{t('dossier.title')}</div>
      </div>

      {isOffline && (
        <div style={{ background: 'rgba(255,209,102,.1)', border: '1px solid rgba(255,209,102,.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--yellow)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          {"📴"} <span>Mode hors ligne — lecture seule</span>
        </div>
      )}

      <div className="tabs">
        {tabs.map(t2 => (
          <div key={t2.id} className={`tab${activeTab === t2.id ? ' active' : ''}`} onClick={() => setActiveTab(t2.id)}>
            {t2.label}
          </div>
        ))}
      </div>

      {/* ── Médicaments ── */}
      {activeTab === 'med' && (
        <>
          <div className="dsect-title">{t('dossier.meds')}</div>
          {meds.length === 0
            ? <div className="empty-state"><div className="empty-icon">{"💊"}</div><p>{t('dossier.no_meds')}</p></div>
            : meds.map(m => (
              <div key={m.id} className="card">
                <div className="card-row">
                  <div className="card-icon" style={{ background: 'rgba(77,159,236,.1)' }}>{"💊"}</div>
                  <div className="card-info">
                    <div className="card-name">{m.name}</div>
                    <div className="card-sub">{m.dose}{m.reason ? ' · ' + m.reason : ''}</div>
                  </div>
                  <span className="badge badge-g">{t('dossier.active')}</span>
                </div>
              </div>
            ))}
          {!isOffline && <div className="add-btn" onClick={() => { setModal('med'); setForm({}) }}>＋ {t('dossier.add_med')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Allergies ── */}
      {activeTab === 'allergy' && (
        <>
          <div className="dsect-title">{t('dossier.allergies')}</div>
          <div className="allergy-wrap">
            {allergies.length === 0
              ? <div className="empty-state"><div className="empty-icon">{"⚠️"}</div><p>{t('dossier.no_allergies')}</p></div>
              : allergies.map(a => (
                <div key={a.id} className="achip">
                  {a.name}
                  {!isOffline && <span className="achip-rm" onClick={() => removeAllergy(a.id)}>✕</span>}
                </div>
              ))}
          </div>
          {!isOffline && <div className="add-btn" onClick={() => { setModal('allergy'); setForm({}) }}>＋ {t('dossier.add_allergy')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Antécédents ── */}
      {activeTab === 'ant' && (
        <>
          <div className="dsect-title">{t('dossier.antecedents')}</div>
          {antecedents.length === 0
            ? <div className="empty-state"><div className="empty-icon">{"📋"}</div><p>{t('dossier.no_antecedents')}</p></div>
            : antecedents.map(a => (
              <div key={a.id} className="card">
                <div className="card-row">
                  <div className="card-icon" style={{ background: 'rgba(255,209,102,.1)' }}>{"🩺"}</div>
                  <div className="card-info">
                    <div className="card-name">{a.name}</div>
                    <div className="card-sub">{a.type}{a.year ? ' · ' + a.year : ''}</div>
                  </div>
                  <span className="badge badge-r">{a.type}</span>
                </div>
              </div>
            ))}
          {!isOffline && <div className="add-btn" onClick={() => { setModal('ant'); setForm({ type: t('dossier.chronic') }) }}>＋ {t('dossier.add_antecedent')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Vaccins ── */}
      {activeTab === 'vacc' && (
        <>
          <div className="dsect-title">{t('dossier.vaccins')}</div>
          {vaccins.map(v => (
            <div key={v.id} className="vacc-row">
              <div>
                <div className="vacc-name">{v.name}</div>
                <div className="vacc-date">{v.date ? formatDate(v.date) : '—'}</div>
              </div>
              <div className="vacc-ico" style={{ background: v.status === 'done' ? 'rgba(0,201,141,.15)' : 'rgba(255,209,102,.15)' }}>
                {v.status === 'done' ? '✅' : '⏳'}
              </div>
            </div>
          ))}
          {!isOffline && <div className="add-btn" onClick={() => { setModal('vacc'); setForm({ status: 'done' }) }}>＋ {t('dossier.add_vaccin')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Documents ── */}
      {activeTab === 'docs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, color: 'var(--white)' }}>{"📄"} {t('dossier.docs')} ({patientDocs.length})</span>
            {!isOffline && (
              <div className="add-btn" style={{ margin: 0, padding: '6px 12px' }} onClick={() => setShowUploadModal(true)}>
                + {t('common.add')}
              </div>
            )}
          </div>

          {docsLoading
            ? <p style={{ color: 'var(--dim)' }}>{t('common.loading')}</p>
            : patientDocs.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--dim)' }}>
                  <div style={{ fontSize: 40 }}>{"📂"}</div>
                  <div>{isOffline ? 'Documents non disponibles hors ligne' : t('dossier.docs')}</div>
                </div>
              )
              : patientDocs.map(doc => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-top">
                    <span style={{ fontSize: 20 }}>{DOC_TYPES[doc.type]?.icon || '📄'}</span>
                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <div className="doc-name">{doc.title}</div>
                      <div className="doc-spec">{DOC_TYPES[doc.type]?.label} · {doc.date}</div>
                      {doc.medecin && <div className="doc-loc">Dr. {doc.medecin}</div>}
                    </div>
                    <button className="doc-btn" style={{ background: 'rgba(77,159,236,.1)', color: 'var(--blue)' }} onClick={() => handleOpenDoc(doc)}>{"👁"}</button>
                    {!isOffline && (
                      <button className="doc-btn" style={{ marginLeft: 4, background: 'rgba(255,90,90,.1)', color: '#FF8A8A' }} onClick={() => handleDeleteDoc(doc)}>{"🗑"}</button>
                    )}
                  </div>
                </div>
              ))}

          {!isOffline && showUploadModal && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowUploadModal(false)}>
              <div className="modal">
                <div className="modal-handle" />
                <div className="modal-title">+ {t('common.add')}</div>
                <div className="form-group">
                  <label className="form-label">Fichier *</label>
                  <div onClick={() => docInputRef.current.click()} style={{ border: '2px dashed rgba(255,255,255,.15)', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files[0]
                        if (f) {
                          setDocFile(f)
                          if (!docForm.title) setDocForm(p => ({ ...p, title: f.name.replace(/\.[^/.]+$/, '') }))
                        }
                      }}
                    />
                    {docFile
                      ? <span style={{ color: 'var(--g)' }}>{"✅"} {docFile.name}</span>
                      : <span style={{ color: 'var(--dim)' }}>{"📂"} Choisir un fichier</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={docForm.title} onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={docForm.type} onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))}>
                    {Object.entries(DOC_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={docForm.date} onChange={e => setDocForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Médecin</label>
                  <input className="form-input" value={docForm.medecin} onChange={e => setDocForm(p => ({ ...p, medecin: e.target.value }))} />
                </div>
                {docError && <div style={{ color: '#FF8A8A', fontSize: 13 }}>{"⚠️"} {docError}</div>}
                <button className="btn-submit" onClick={handleUpload} disabled={uploadingDoc}>
                  {uploadingDoc ? '⏳...' : '⬆️ ' + t('common.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modales formulaires ── */}
      {!isOffline && modal === 'med' && (
        <Modal title={t('dossier.add_med')} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" placeholder="Metformine 850mg" onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Posologie</label>
              <input className="form-input" placeholder="2x/jour" onChange={e => setForm({ ...form, dose: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Indication</label>
              <input className="form-input" placeholder="Diabète" onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <button className="btn-submit" onClick={addMed} disabled={saving}>{saving ? '⏳...' : t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
      {!isOffline && modal === 'allergy' && (
        <Modal title={t('dossier.add_allergy')} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Allergie</label>
            <input className="form-input" placeholder="Pénicilline" onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <button className="btn-submit" onClick={addAllergy} disabled={saving}>{saving ? '⏳...' : t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
      {!isOffline && modal === 'ant' && (
        <Modal title={t('dossier.add_antecedent')} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Condition</label>
            <input className="form-input" placeholder="Diabète de type 2" onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Année</label>
              <input className="form-input" type="number" placeholder="2018" onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" onChange={e => setForm({ ...form, type: e.target.value })}>
                {[t('dossier.chronic'), t('dossier.hospitalization'), t('dossier.surgery'), t('dossier.other')].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn-submit" onClick={addAnt} disabled={saving}>{saving ? '⏳...' : t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
      {!isOffline && modal === 'vacc' && (
        <Modal title={t('dossier.add_vaccin')} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Vaccin</label>
            <input className="form-input" placeholder="BCG, Covid-19..." onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-select" onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="done">{"✅"} Fait</option>
                <option value="pending">{"⏳"} À faire</option>
              </select>
            </div>
          </div>
          <button className="btn-submit" onClick={addVacc} disabled={saving}>{saving ? '⏳...' : t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
