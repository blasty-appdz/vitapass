import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/formatters'

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

  useEffect(() => { loadDoctors() }, [])

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

      const doctorProfiles = []
      for (const access of accesses) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id,fname,lname,gender,specialite,numero_ordre')
          .eq('id', access.doctor_id)
          .maybeSingle()
        if (prof) doctorProfiles.push({ ...prof, access_id: access.id, since: access.granted_at })
      }
      setDoctors(doctorProfiles)
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
        setSearchError('Aucun médecin trouvé avec cet email')
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
      const { error } = await supabase
        .from('doctor_access')
        .insert({ patient_id: user.id, doctor_id: foundDoctor.id, status: 'active' })
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
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">{t('home.doctors_title')}</div>
      </div>

      {loading
        ? <div className="loading">{t('common.loading')}</div>
        : doctors.length === 0
          ? (
            <div className="empty-state" style={{ marginTop: 24 }}>
              <div className="empty-icon">{"👨‍⚕️"}</div>
              <p>Aucun médecin autorisé</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Ajoutez un médecin pour lui donner accès à votre dossier</p>
            </div>
          )
          : doctors.map(doc => (
            <div key={doc.id} className="doctor-card">
              <div className="doctor-card-row">
                <div className="doctor-av">
                  {doc.gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️'}
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
        ＋ {t('common.add')}
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
              <span style={{ fontSize: 28 }}>{foundDoctor.gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️'}</span>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: 'var(--white)' }}>
                  Dr. {foundDoctor.fname} {foundDoctor.lname}
                </div>
                {foundDoctor.specialite && (
                  <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>{foundDoctor.specialite}</div>
                )}
              </div>
            </div>
          )}
          {!foundDoctor
            ? <button className="btn-submit" onClick={searchDoctorReal} disabled={searching}>
                {searching ? t('common.loading') : t('common.search')}
              </button>
            : <button className="btn-submit" onClick={authorizeDoctor} disabled={adding}>
                {adding ? '⏳...' : t('common.confirm')}
              </button>}
          <button className="btn-cancel" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
