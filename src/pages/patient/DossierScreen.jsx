import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/formatters'
import { openDocument, hasDocumentFile } from '../../services/documents'
import Icon from '../../components/common/Icon'

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
  const vaccins = dossier?.vaccins || []

  // Suppression d'un élément d'une liste du dossier (médicament, antécédent, vaccin)
  const removeItem = async (key, list, item) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!confirm(`Supprimer « ${item.name} » ?`)) return
    await onSave({ [key]: list.filter(x => x !== item) })
    showToast('✅ Supprimé')
  }

  useEffect(() => {
    if (activeTab === 'docs') loadDocs()
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleOpenDoc = (doc) => openDocument(doc, (msg) => showToast('❌ ' + msg))

  const handleDeleteDoc = async (doc) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!confirm(t('common.delete') + ' ?')) return
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) { showToast('❌ ' + error.message); return }
    if (doc.storage_path) await supabase.storage.from('documents').remove([doc.storage_path])
    loadDocs()
    showToast('✅ ' + t('common.success'))
  }

  const handleUpload = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!docFile) { setDocError('Fichier requis'); return }
    if (!docForm.title.trim()) { setDocError('Nom requis'); return }
    if (docFile.size > 10 * 1024 * 1024) { setDocError('Fichier trop lourd (10 Mo maximum)'); return }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(docFile.type)) { setDocError('Formats acceptés : PDF, JPG, PNG'); return }
    setUploadingDoc(true)
    setDocError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = docFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, docFile)
      if (upErr) { setDocError(upErr.message); setUploadingDoc(false); return }
      const { error: insErr } = await supabase.from('documents').insert({
        patient_id: user.id,
        title: docForm.title,
        type: docForm.type,
        date: docForm.date || null,
        medecin: docForm.medecin || null,
        storage_path: path,
        mime_type: docFile.type || null,
        file_size: docFile.size || null,
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
    { id: 'med', icon: 'pill', label: t('dossier.meds') },
    { id: 'allergy', icon: 'alert', label: t('dossier.allergies') },
    { id: 'ant', icon: 'clipboard', label: t('dossier.antecedents') },
    { id: 'vacc', icon: 'syringe', label: t('dossier.vaccins') },
    { id: 'docs', icon: 'folder', label: t('dossier.docs') },
  ]

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">{t('dossier.title')}</div>
      </div>

      {isOffline && (
        <div style={{ background: 'rgba(255,209,102,.1)', border: '1px solid rgba(255,209,102,.25)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: 'var(--yellow)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon e="📴" /> <span>Mode hors ligne — lecture seule</span>
        </div>
      )}

      <div className="tabs">
        {tabs.map(t2 => (
          <div key={t2.id} className={`tab${activeTab === t2.id ? ' active' : ''}`} onClick={() => setActiveTab(t2.id)}>
            <Icon name={t2.icon} size={15} />{t2.label}
          </div>
        ))}
      </div>

      {/* ── Médicaments ── */}
      {activeTab === 'med' && (
        <>
          <div className="dsect-title">{t('dossier.meds')}</div>
          {meds.length === 0
            ? <div className="empty-state"><div className="empty-icon"><Icon e="💊" /></div><p>{t('dossier.no_meds')}</p></div>
            : meds.map(m => (
              <div key={m.id} className="card">
                <div className="card-row">
                  <div className="card-icon" style={{ background: 'rgba(77,159,236,.1)' }}><Icon e="💊" /></div>
                  <div className="card-info">
                    <div className="card-name">{m.name}</div>
                    <div className="card-sub">{m.dose}{m.reason ? ' · ' + m.reason : ''}</div>
                  </div>
                  <span className="badge badge-g">{t('dossier.active')}</span>
                  {!isOffline && <span className="achip-rm" style={{ marginLeft: 8, cursor: 'pointer' }} onClick={() => removeItem('meds', meds, m)}><Icon name="x" size={15} /></span>}
                </div>
              </div>
            ))}
          {!isOffline && <div className="add-btn" onClick={() => { setModal('med'); setForm({}) }}><Icon name="plus" size={17} /> {t('dossier.add_med')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Allergies ── */}
      {activeTab === 'allergy' && (
        <>
          <div className="dsect-title">{t('dossier.allergies')}</div>
          <div className="allergy-wrap">
            {allergies.length === 0
              ? <div className="empty-state"><div className="empty-icon"><Icon e="⚠️" /></div><p>{t('dossier.no_allergies')}</p></div>
              : allergies.map(a => (
                <div key={a.id} className="achip">
                  {a.name}
                  {!isOffline && <span className="achip-rm" onClick={() => removeAllergy(a.id)}><Icon name="x" size={15} /></span>}
                </div>
              ))}
          </div>
          {!isOffline && <div className="add-btn" onClick={() => { setModal('allergy'); setForm({}) }}><Icon name="plus" size={17} /> {t('dossier.add_allergy')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Antécédents ── */}
      {activeTab === 'ant' && (
        <>
          <div className="dsect-title">{t('dossier.antecedents')}</div>
          {antecedents.length === 0
            ? <div className="empty-state"><div className="empty-icon"><Icon e="📋" /></div><p>{t('dossier.no_antecedents')}</p></div>
            : antecedents.map(a => (
              <div key={a.id} className="card">
                <div className="card-row">
                  <div className="card-icon" style={{ background: 'rgba(255,209,102,.1)' }}><Icon e="🩺" /></div>
                  <div className="card-info">
                    <div className="card-name">{a.name}</div>
                    <div className="card-sub">{a.type}{a.year ? ' · ' + a.year : ''}</div>
                  </div>
                  <span className="badge badge-r">{a.type}</span>
                  {!isOffline && <span className="achip-rm" style={{ marginLeft: 8, cursor: 'pointer' }} onClick={() => removeItem('antecedents', antecedents, a)}><Icon name="x" size={15} /></span>}
                </div>
              </div>
            ))}
          {!isOffline && <div className="add-btn" onClick={() => { setModal('ant'); setForm({ type: t('dossier.chronic') }) }}><Icon name="plus" size={17} /> {t('dossier.add_antecedent')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Vaccins ── */}
      {activeTab === 'vacc' && (
        <>
          <div className="dsect-title">{t('dossier.vaccins')}</div>
          {vaccins.length === 0 && <div className="empty-state"><div className="empty-icon"><Icon e="💉" /></div><p>Aucun vaccin renseigné</p></div>}
          {vaccins.map(v => (
            <div key={v.id} className="vacc-row">
              <div>
                <div className="vacc-name">{v.name}</div>
                <div className="vacc-date">{v.date ? formatDate(v.date) : '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="vacc-ico" style={{ background: v.status === 'done' ? 'rgba(0,201,141,.15)' : 'rgba(255,209,102,.15)' }}>
                  <Icon e={v.status === 'done' ? '✅' : '⏳'} size={18} />
                </div>
                {!isOffline && <span className="achip-rm" style={{ cursor: 'pointer' }} onClick={() => removeItem('vaccins', vaccins, v)}><Icon name="x" size={15} /></span>}
              </div>
            </div>
          ))}
          {!isOffline && <div className="add-btn" onClick={() => { setModal('vacc'); setForm({ status: 'done' }) }}><Icon name="plus" size={17} /> {t('dossier.add_vaccin')}</div>}
          <div className="pad-b" />
        </>
      )}

      {/* ── Documents ── */}
      {activeTab === 'docs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, color: 'var(--white)' }}><Icon e="📄" /> {t('dossier.docs')} ({patientDocs.length})</span>
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
                  <div style={{ fontSize: 40 }}><Icon e="📂" /></div>
                  <div>{isOffline ? 'Documents non disponibles hors ligne' : 'Aucun document. Ajoutez vos ordonnances, analyses et radios.'}</div>
                </div>
              )
              : patientDocs.map(doc => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-top">
                    <Icon e={doc.type === 'note_medecin' ? '📝' : DOC_TYPES[doc.type]?.icon || '📄'} size={20} />
                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <div className="doc-name">{doc.title}</div>
                      <div className="doc-spec">
                        {doc.type === 'note_medecin' ? 'Note de votre médecin' : DOC_TYPES[doc.type]?.label || 'Document'}
                        {(doc.date || doc.created_at) ? ' · ' + formatDate(doc.date || doc.created_at) : ''}
                      </div>
                      {doc.medecin && <div className="doc-loc">Dr. {doc.medecin}</div>}
                      {doc.content && <div style={{ fontSize: 13, color: 'rgba(239,243,255,.8)', marginTop: 6, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{doc.content}</div>}
                    </div>
                    {hasDocumentFile(doc) && (
                      <button className="doc-btn" style={{ background: 'rgba(77,159,236,.1)', color: 'var(--blue)' }} onClick={() => handleOpenDoc(doc)}><Icon e="👁" /></button>
                    )}
                    {!isOffline && doc.type !== 'note_medecin' && (
                      <button className="doc-btn" style={{ marginLeft: 4, background: 'rgba(255,90,90,.1)', color: '#FF8A8A' }} onClick={() => handleDeleteDoc(doc)}><Icon e="🗑" /></button>
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
                      ? <span style={{ color: 'var(--g)' }}><Icon e="✅" /> {docFile.name}</span>
                      : <span style={{ color: 'var(--dim)' }}><Icon e="📂" /> Choisir un fichier</span>}
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
                      <option key={k} value={k}>{v.label}</option>
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
                {docError && <div style={{ color: '#FF8A8A', fontSize: 13 }}><Icon e="⚠️" /> {docError}</div>}
                <button className="btn-submit" onClick={handleUpload} disabled={uploadingDoc}>
                  {uploadingDoc ? '…' : t('common.save')}
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
          <button className="btn-submit" onClick={addMed} disabled={saving}>{saving ? '…' : t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
      {!isOffline && modal === 'allergy' && (
        <Modal title={t('dossier.add_allergy')} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Allergie</label>
            <input className="form-input" placeholder="Pénicilline" onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <button className="btn-submit" onClick={addAllergy} disabled={saving}>{saving ? '…' : t('common.save')}</button>
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
          <button className="btn-submit" onClick={addAnt} disabled={saving}>{saving ? '…' : t('common.save')}</button>
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
                <option value="done"><Icon e="✅" /> Fait</option>
                <option value="pending"><Icon e="⏳" /> À faire</option>
              </select>
            </div>
          </div>
          <button className="btn-submit" onClick={addVacc} disabled={saving}>{saving ? '…' : t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
