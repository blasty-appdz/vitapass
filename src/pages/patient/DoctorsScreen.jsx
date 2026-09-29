import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/formatters'
import Icon from '../../components/common/Icon'

export default function DoctorsScreen({ nav, showToast }) {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundDoctor, setFoundDoctor] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadDoctors() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: accesses, error } = await supabase
        .from('doctor_access')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'active')
      if (error) { console.error(error.message); setLoading(false); return }
      if (!accesses || accesses.length === 0) { setDoctors([]); setLoading(false); return }

      const ids = accesses.map(a => a.doctor_id)
      const [{ data: pros }, { data: profs }, { data: secs }] = await Promise.all([
        supabase.from('professionals').select('id,fname,lname,gender,specialite,wilaya').in('id', ids),
        supabase.from('profiles').select('id,fname,lname,gender,specialite,numero_ordre').in('id', ids),
        // Transparence : secrétaires que chaque médecin a autorisées sur ce dossier
        supabase.rpc('patient_dossier_secretaries'),
      ])
      setDoctors(accesses.map(access => {
        const pr = (pros || []).find(p => p.id === access.doctor_id)
        const pf = (profs || []).find(p => p.id === access.doctor_id)
        const base = pr?.fname ? pr : (pf || { id: access.doctor_id })
        const secretaries = (secs || []).filter(x => x.doctor_id === access.doctor_id).map(x => `${x.fname || ''} ${x.lname || ''}`.trim()).filter(Boolean)
        return { ...base, specialite: pr?.specialite || pf?.specialite, access_id: access.id, since: access.granted_at, secretaries }
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const searchDoctorReal = async () => {
    if (!email.trim()) { setSearchError(t('common.required')); return }
    setSearching(true); setSearchError(''); setFoundDoctor(null)
    try {
      const { data, error } = await supabase.rpc('find_doctor_by_email', { p_email: email.trim().toLowerCase() })
      if (error || !data || data.length === 0) {
        setSearchError('Aucun médecin validé avec cet e-mail. Vérifiez l\'adresse utilisée par votre médecin pour son compte VitaPass.')
        setSearching(false)
        return
      }
      const doc = data[0]
      if (doc.role !== 'doctor') { setSearchError('Ce compte n\'est pas un médecin'); setSearching(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      const { data: existing } = await supabase
        .from('doctor_access')
        .select('id')
        .eq('patient_id', user.id)
        .eq('doctor_id', doc.id)
        .eq('status', 'active')
        .maybeSingle()
      if (existing) { setSearchError('Ce médecin est déjà autorisé'); setSearching(false); return }
      setFoundDoctor(doc)
    } catch (e) {
      setSearchError('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  const authorizeDoctor = async () => {
    if (!foundDoctor) return
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // Une seule ligne par couple patient/médecin : si l'accès avait été révoqué, on le réactive
      const { data: previous } = await supabase
        .from('doctor_access')
        .select('id')
        .eq('patient_id', user.id)
        .eq('doctor_id', foundDoctor.id)
        .limit(1)
      const { error } = previous && previous.length > 0
        ? await supabase.from('doctor_access').update({ status: 'active', granted_at: new Date().toISOString() }).eq('id', previous[0].id)
        : await supabase.from('doctor_access').insert({ patient_id: user.id, doctor_id: foundDoctor.id, status: 'active' })
      if (error) { showToast('❌ ' + error.message); return }
      showToast('✅ Médecin autorisé')
      setShowModal(false); setEmail(''); setFoundDoctor(null)
      loadDoctors()
    } catch (e) {
      showToast('❌ Erreur')
    } finally {
      setAdding(false)
    }
  }

  const revokeDoctor = async (accessId) => {
    if (!confirm('Révoquer l\'accès à ce médecin ?')) return
    const { error } = await supabase.from('doctor_access').update({ status: 'revoked' }).eq('id', accessId)
    if (error) { showToast('❌ ' + error.message); return }
    showToast('✅ Accès révoqué')
    loadDoctors()
  }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">{t('home.doctors_title')}</div>
      </div>

      {loading
        ? <div className="loading">{t('common.loading')}</div>
        : doctors.length === 0
          ? (
            <div className="empty-state" style={{ marginTop: 24 }}>
              <div className="empty-icon"><Icon e="👨‍⚕️" /></div>
              <p>Aucun médecin autorisé</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Ajoutez un médecin pour lui donner accès à votre dossier</p>
            </div>
          )
          : doctors.map(doc => (
            <div key={doc.id} className="doctor-card">
              <div className="doctor-card-row">
                <div className="doctor-av">
                  <Icon name="doctor" size={22} />
                </div>
                <div className="doctor-info">
                  <div className="doctor-name">Dr. {doc.fname} {doc.lname}</div>
                  {doc.specialite && <div className="doctor-spec">{doc.specialite}</div>}
                  <div className="doctor-email">Depuis {formatDate(doc.since)}</div>
                  {doc.secretaries?.length > 0 && (
                    <div className="doctor-email" style={{ marginTop: 4 }}>
                      <Icon e="📋" size={13} /> Secrétariat : {doc.secretaries.join(', ')}
                    </div>
                  )}
                </div>
                <div className="revoke-btn" onClick={() => revokeDoctor(doc.access_id)}>
                  Révoquer
                </div>
              </div>
            </div>
          ))}

      <div
        className="add-btn"
        onClick={() => { setShowModal(true); setEmail(''); setFoundDoctor(null); setSearchError('') }}
      >
        <Icon name="plus" size={17} /> Autoriser un médecin à voir mon dossier
      </div>
      <div className="pad-b" />

      {showModal && (
        <Modal title="Autoriser un médecin" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Email du médecin</label>
            <input
              className="form-input"
              type="email"
              placeholder="medecin@exemple.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setFoundDoctor(null); setSearchError('') }}
            />
          </div>
          {searchError && <div className="error-msg">{searchError}</div>}
          {foundDoctor && (
            <div style={{ background: 'rgba(0,201,141,.06)', border: '1px solid rgba(0,201,141,.2)', borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="doctor-av"><Icon name="doctor" size={22} /></span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--white)' }}>
                  Dr. {foundDoctor.fname} {foundDoctor.lname}
                </div>
                {foundDoctor.specialite && (
                  <div style={{ fontSize: 13, color: 'var(--blue)', marginTop: 2 }}>{foundDoctor.specialite}</div>
                )}
              </div>
            </div>
          )}
          {!foundDoctor
            ? <button className="btn-submit" onClick={searchDoctorReal} disabled={searching}>
                {searching ? t('common.loading') : t('common.search')}
              </button>
            : <button className="btn-submit" onClick={authorizeDoctor} disabled={adding}>
                {adding ? '…' : t('common.confirm')}
              </button>}
          <button className="btn-cancel" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/formatters'
import Icon from '../../components/common/Icon'

export default function DoctorsScreen({ nav, showToast }) {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundDoctor, setFoundDoctor] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadDoctors() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: accesses, error } = await supabase
        .from('doctor_access')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'active')
      if (error) { console.error(error.message); setLoading(false); return }
      if (!accesses || accesses.length === 0) { setDoctors([]); setLoading(false); return }

      const ids = accesses.map(a => a.doctor_id)
      const [{ data: pros }, { data: profs }] = await Promise.all([
        supabase.from('professionals').select('id,fname,lname,gender,specialite,wilaya').in('id', ids),
        supabase.from('profiles').select('id,fname,lname,gender,specialite,numero_ordre').in('id', ids),
      ])
      setDoctors(accesses.map(access => {
        const pr = (pros || []).find(p => p.id === access.doctor_id)
        const pf = (profs || []).find(p => p.id === access.doctor_id)
        const base = pr?.fname ? pr : (pf || { id: access.doctor_id })
        return { ...base, specialite: pr?.specialite || pf?.specialite, access_id: access.id, since: access.granted_at }
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const searchDoctorReal = async () => {
    if (!email.trim()) { setSearchError(t('common.required')); return }
    setSearching(true); setSearchError(''); setFoundDoctor(null)
    try {
      const { data, error } = await supabase.rpc('find_doctor_by_email', { p_email: email.trim().toLowerCase() })
      if (error || !data || data.length === 0) {
        setSearchError('Aucun médecin validé avec cet e-mail. Vérifiez l\'adresse utilisée par votre médecin pour son compte VitaPass.')
        setSearching(false)
        return
      }
      const doc = data[0]
      if (doc.role !== 'doctor') { setSearchError('Ce compte n\'est pas un médecin'); setSearching(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      const { data: existing } = await supabase
        .from('doctor_access')
        .select('id')
        .eq('patient_id', user.id)
        .eq('doctor_id', doc.id)
        .eq('status', 'active')
        .maybeSingle()
      if (existing) { setSearchError('Ce médecin est déjà autorisé'); setSearching(false); return }
      setFoundDoctor(doc)
    } catch (e) {
      setSearchError('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  const authorizeDoctor = async () => {
    if (!foundDoctor) return
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // Une seule ligne par couple patient/médecin : si l'accès avait été révoqué, on le réactive
      const { data: previous } = await supabase
        .from('doctor_access')
        .select('id')
        .eq('patient_id', user.id)
        .eq('doctor_id', foundDoctor.id)
        .limit(1)
      const { error } = previous && previous.length > 0
        ? await supabase.from('doctor_access').update({ status: 'active', granted_at: new Date().toISOString() }).eq('id', previous[0].id)
        : await supabase.from('doctor_access').insert({ patient_id: user.id, doctor_id: foundDoctor.id, status: 'active' })
      if (error) { showToast('❌ ' + error.message); return }
      showToast('✅ Médecin autorisé')
      setShowModal(false); setEmail(''); setFoundDoctor(null)
      loadDoctors()
    } catch (e) {
      showToast('❌ Erreur')
    } finally {
      setAdding(false)
    }
  }

  const revokeDoctor = async (accessId) => {
    if (!confirm('Révoquer l\'accès à ce médecin ?')) return
    const { error } = await supabase.from('doctor_access').update({ status: 'revoked' }).eq('id', accessId)
    if (error) { showToast('❌ ' + error.message); return }
    showToast('✅ Accès révoqué')
    loadDoctors()
  }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">{t('home.doctors_title')}</div>
      </div>

      {loading
        ? <div className="loading">{t('common.loading')}</div>
        : doctors.length === 0
          ? (
            <div className="empty-state" style={{ marginTop: 24 }}>
              <div className="empty-icon"><Icon e="👨‍⚕️" /></div>
              <p>Aucun médecin autorisé</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Ajoutez un médecin pour lui donner accès à votre dossier</p>
            </div>
          )
          : doctors.map(doc => (
            <div key={doc.id} className="doctor-card">
              <div className="doctor-card-row">
                <div className="doctor-av">
                  <Icon name="doctor" size={22} />
                </div>
                <div className="doctor-info">
                  <div className="doctor-name">Dr. {doc.fname} {doc.lname}</div>
                  {doc.specialite && <div className="doctor-spec">{doc.specialite}</div>}
                  <div className="doctor-email">Depuis {formatDate(doc.since)}</div>
                </div>
                <div className="revoke-btn" onClick={() => revokeDoctor(doc.access_id)}>
                  Révoquer
                </div>
              </div>
            </div>
          ))}

      <div
        className="add-btn"
        onClick={() => { setShowModal(true); setEmail(''); setFoundDoctor(null); setSearchError('') }}
      >
        <Icon name="plus" size={17} /> Autoriser un médecin à voir mon dossier
      </div>
      <div className="pad-b" />

      {showModal && (
        <Modal title="Autoriser un médecin" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Email du médecin</label>
            <input
              className="form-input"
              type="email"
              placeholder="medecin@exemple.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setFoundDoctor(null); setSearchError('') }}
            />
          </div>
          {searchError && <div className="error-msg">{searchError}</div>}
          {foundDoctor && (
            <div style={{ background: 'rgba(0,201,141,.06)', border: '1px solid rgba(0,201,141,.2)', borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="doctor-av"><Icon name="doctor" size={22} /></span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--white)' }}>
                  Dr. {foundDoctor.fname} {foundDoctor.lname}
                </div>
                {foundDoctor.specialite && (
                  <div style={{ fontSize: 13, color: 'var(--blue)', marginTop: 2 }}>{foundDoctor.specialite}</div>
                )}
              </div>
            </div>
          )}
          {!foundDoctor
            ? <button className="btn-submit" onClick={searchDoctorReal} disabled={searching}>
                {searching ? t('common.loading') : t('common.search')}
              </button>
            : <button className="btn-submit" onClick={authorizeDoctor} disabled={adding}>
                {adding ? '…' : t('common.confirm')}
              </button>}
          <button className="btn-cancel" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
