import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { WILAYAS, SPECIALITES, SPECIALITE_ICONS, LANGUES, langueLabel } from '../../data'
import Icon, { IconText } from '../../components/common/Icon'
export default function SearchScreen({ nav }) {
  const [pros, setPros] = useState([])
  const [loading, setLoading] = useState(false)
  const [wilaya, setWilaya] = useState('')
  const [specialite, setSpecialite] = useState('')
  const [langue, setLangue] = useState('')
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    setLoading(true)
    setSearched(true)
    setError('')
    try {
      let query = supabase
        .from('professionals')
        .select('id, fname, lname, gender, specialite, wilaya, adresse, tarif, duree_rdv, langues, photo_url, bio, is_available')
        .eq('validated', true)
        .eq('is_available', true)

      if (wilaya) query = query.eq('wilaya', wilaya)
      if (specialite) query = query.eq('specialite', specialite)
      if (langue) query = query.contains('langues', [langue])

      const { data, error: qErr } = await query.order('fname')
      if (qErr) { setError('Erreur lors de la recherche'); console.error(qErr.message) }
      else setPros(data || [])
    } catch (e) {
      setError('Erreur inattendue')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { search() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">Trouver un professionnel</div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <select className="form-select" value={specialite} onChange={e => setSpecialite(e.target.value)}>
          <option value=""><Icon e="🔍" /> Toutes les spécialités</option>
          {SPECIALITES.map(s => (
            <option key={s} value={s}>{SPECIALITE_ICONS[s]} {s}</option>
          ))}
        </select>

        <select className="form-select" value={wilaya} onChange={e => setWilaya(e.target.value)}>
          <option value=""><Icon e="📍" /> Toutes les wilayas</option>
          {WILAYAS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <select className="form-select" value={langue} onChange={e => setLangue(e.target.value)}>
          <option value=""><Icon e="🌐" /> Toutes les langues</option>
          {LANGUES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        <button className="btn-submit" onClick={search} disabled={loading}>
          {loading ? 'Recherche…' : <><Icon name="search" size={18} /> Rechercher</>}
        </button>
      </div>

      {error && <div className="error-msg"><IconText>{error}</IconText></div>}

      {loading && <div className="loading"><Icon e="⏳" /> Chargement...</div>}

      {!loading && searched && (
        <div style={{ fontSize: 13.5, color: 'var(--dim)', marginBottom: 10, fontWeight: 500 }}>
          {pros.length} professionnel(s) trouvé(s)
        </div>
      )}

      {!loading && searched && pros.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-icon"><Icon e="🔍" /></div>
          <p>Aucun professionnel trouvé</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>Essayez d'autres filtres</p>
        </div>
      )}

      {!loading && pros.map(pro => (
        <ProCard key={pro.id} pro={pro} nav={nav} />
      ))}

      <div className="pad-b" />
    </div>
  )
}

function ProCard({ pro, nav }) {
  const icon = SPECIALITE_ICONS[pro.specialite] || '🏥'
  const avatar = <Icon name="doctor" size={22} />

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', marginBottom: 10 }}
      onClick={() => nav('pro-profile', { proId: pro.id })}
    >
      <div className="card-row" style={{ marginBottom: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(77,159,236,.1)', border: '1px solid rgba(77,159,236,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {avatar}
        </div>
        <div className="card-info">
          <div className="card-name">Dr. {pro.fname} {pro.lname}</div>
          <div className="card-sub" style={{ color: 'var(--blue)' }}><Icon e={icon} size={14} /> {pro.specialite}</div>
          {pro.wilaya && (
            <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 3 }}>
              <Icon e="📍" /> {pro.wilaya}{pro.adresse ? ` · ${pro.adresse}` : ''}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--g)' }}>
            {pro.tarif ? `${pro.tarif} DA` : '—'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 2 }}>
            {pro.duree_rdv ? `${pro.duree_rdv} min` : ''}
          </div>
        </div>
      </div>

      {pro.langues && pro.langues.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {pro.langues.map(l => (
            <span key={l} className="badge badge-g">
              {langueLabel(l)}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn-submit"
          style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
          onClick={e => { e.stopPropagation(); nav('booking', { proId: pro.id }) }}
        >
          <Icon e="📅" /> Prendre RDV
        </button>
        <button
          className="btn-cancel"
          style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
          onClick={e => { e.stopPropagation(); nav('pro-profile', { proId: pro.id }) }}
        >
          Voir le profil <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  )
}
