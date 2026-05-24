import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const WILAYAS = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane']

const SPECIALITES = [
  'Médecin généraliste','Cardiologue','Pédiatre','Gynécologue','Dermatologue',
  'Ophtalmologue','ORL','Orthopédiste','Neurologue','Psychiatre','Pneumologue',
  'Gastro-entérologue','Endocrinologue','Néphrologue','Rhumatologue','Urologue',
  'Oncologue','Diabétologue','Dentiste','Sage-femme','Kinésithérapeute',
  'Nutritionniste','Psychologue','Radiologue','Biologiste médical'
]

const SPECIALITE_ICONS = {
  'Médecin généraliste': '🏥', 'Cardiologue': '❤️', 'Pédiatre': '👶',
  'Gynécologue': '🌸', 'Dermatologue': '🔬', 'Ophtalmologue': '👁️',
  'ORL': '👂', 'Orthopédiste': '🦴', 'Neurologue': '🧠',
  'Psychiatre': '🧩', 'Pneumologue': '🫁', 'Gastro-entérologue': '🫄',
  'Endocrinologue': '⚗️', 'Néphrologue': '🫘', 'Rhumatologue': '🦴',
  'Urologue': '💧', 'Oncologue': '🎗️', 'Diabétologue': '🩸',
  'Dentiste': '🦷', 'Sage-femme': '👼', 'Kinésithérapeute': '💪',
  'Nutritionniste': '🥗', 'Psychologue': '🧘', 'Radiologue': '🩻',
  'Biologiste médical': '🧪'
}

export default function SearchScreen({ nav }) {
  const [pros, setPros] = useState([])
  const [loading, setLoading] = useState(false)
  const [wilaya, setWilaya] = useState('')
  const [specialite, setSpecialite] = useState('')
  const [langue, setLangue] = useState('')
  const [searched, setSearched] = useState(false)

  const search = async () => {
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('professionals')
      .select('id, fname, lname, gender, specialite, wilaya, adresse, tarif, duree_rdv, langues, photo_url, bio, is_available')
      .eq('validated', true)
      .eq('is_available', true)

    if (wilaya) query = query.eq('wilaya', wilaya)
    if (specialite) query = query.eq('specialite', specialite)

    const { data } = await query.order('fname')
    setPros(data || [])
    setLoading(false)
  }

  useEffect(() => { search() }, [])

  return (
    <div className="screen" style={{ display: 'flex' }}>

      {/* HEADER */}
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">Trouver un professionnel</div>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>

        <select
          className="form-select"
          value={specialite}
          onChange={e => setSpecialite(e.target.value)}
        >
          <option value="">🔍 Toutes les spécialités</option>
          {SPECIALITES.map(s => (
            <option key={s} value={s}>{SPECIALITE_ICONS[s]} {s}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={wilaya}
          onChange={e => setWilaya(e.target.value)}
        >
          <option value="">📍 Toutes les wilayas</option>
          {WILAYAS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={langue}
          onChange={e => setLangue(e.target.value)}
        >
          <option value="">🌐 Toutes les langues</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>

        <button className="btn-submit" onClick={search} disabled={loading}>
          {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
        </button>
      </div>

      {/* RÉSULTATS */}
      {loading && (
        <div className="loading">⏳ Chargement...</div>
      )}

      {!loading && searched && (
        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {pros.length} professionnel(s) trouvé(s)
        </div>
      )}

      {!loading && searched && pros.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-icon">🔍</div>
          <p>Aucun professionnel trouvé</p>
          <p style={{ marginTop: 8, fontSize: 12 }}>Essayez d'autres filtres</p>
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
  const avatar = pro.gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️'

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', marginBottom: 10 }}
      onClick={() => nav('pro-profile', { proId: pro.id })}
    >
      <div className="card-row" style={{ marginBottom: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(77,159,236,.1)', border: '1px solid rgba(77,159,236,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0
        }}>
          {avatar}
        </div>
        <div className="card-info">
          <div className="card-name">Dr. {pro.fname} {pro.lname}</div>
          <div className="card-sub" style={{ color: 'var(--blue)' }}>
            {icon} {pro.specialite}
          </div>
          {pro.wilaya && (
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 3 }}>
              📍 {pro.wilaya}{pro.adresse ? ` · ${pro.adresse}` : ''}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--g)' }}>
            {pro.tarif ? `${pro.tarif} DA` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
            {pro.duree_rdv ? `${pro.duree_rdv} min` : ''}
          </div>
        </div>
      </div>

      {pro.langues && pro.langues.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {pro.langues.map(l => (
            <span key={l} className="badge badge-g">
              {l === 'fr' ? '🇫🇷 Français' : l === 'ar' ? '🇩🇿 Arabe' : l}
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
          📅 Prendre RDV
        </button>
        <button
          className="btn-cancel"
          style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
          onClick={e => { e.stopPropagation(); nav('pro-profile', { proId: pro.id }) }}
        >
          Voir le profil →
        </button>
      </div>
    </div>
  )}