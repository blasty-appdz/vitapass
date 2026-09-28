import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { SPECIALITE_ICONS, langueLabel } from '../../data'
import Icon from '../../components/common/Icon'

export default function ProProfileScreen({ nav, navParams }) {
  const [pro, setPro] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (navParams?.proId) loadPro(navParams.proId)
  }, [navParams])

  const loadPro = async (id) => {
    setLoading(true)
    const { data } = await supabase
      .from('professionals')
      .select('id, fname, lname, gender, specialite, sous_specialite, wilaya, adresse, telephone, tarif, duree_rdv, langues, photo_url, bio, is_available, numero_ordre')
      .eq('id', id)
      .maybeSingle()
    setPro(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('search')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">Profil</div>
      </div>
      <div className="loading"><div className="spin" />Chargement…</div>
    </div>
  )

  if (!pro) return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('search')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">Profil</div>
      </div>
      <div className="empty-state">
        <div className="empty-icon"><Icon name="xCircle" /></div>
        <p>Professionnel introuvable</p>
      </div>
    </div>
  )

  const icon = SPECIALITE_ICONS[pro.specialite] || '🏥'
  const avatar = <Icon name="doctor" size={30} />

  return (
    <div className="screen" style={{ display: 'flex' }}>

      {/* HEADER */}
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('search')}><Icon name="chevronLeft" size={20} /></div>
        <div className="shdr-title">Profil du médecin</div>
      </div>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(77,159,236,.08) 0%, transparent 100%)',
        borderRadius: 20, padding: '24px 20px', marginBottom: 14,
        border: '1px solid rgba(77,159,236,.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(77,159,236,.1)', border: '2px solid rgba(77,159,236,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
        }}>
          {avatar}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)', textAlign: 'center' }}>
          Dr. {pro.fname} {pro.lname}
        </div>
        <div style={{ fontSize: 14, color: 'var(--blue)', fontWeight: 600 }}>
          <Icon e={icon} size={15} /> {pro.specialite}
        </div>
        {pro.wilaya && (
          <div style={{ fontSize: 13, color: 'var(--dim)' }}>
            <Icon name="pin" size={14} /> {pro.wilaya}{pro.adresse ? ` · ${pro.adresse}` : ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <span style={{
            background: 'rgba(0,201,141,.12)', color: 'var(--g)',
            border: '1px solid rgba(0,201,141,.2)',
            fontSize: 13, fontWeight: 700,
            padding: '4px 14px', borderRadius: 20
          }}>
            {pro.tarif ? `${pro.tarif} DA` : 'Tarif N/A'}
          </span>
          <span style={{
            background: 'rgba(77,159,236,.12)', color: 'var(--blue)',
            border: '1px solid rgba(77,159,236,.2)',
            fontSize: 13, fontWeight: 700,
            padding: '4px 14px', borderRadius: 20
          }}>
            {pro.duree_rdv ? `${pro.duree_rdv} min` : '30 min'}
          </span>
        </div>
      </div>

      {/* BIO */}
      {pro.bio && (
        <>
          <div className="dsect-title">À propos</div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: 14, marginBottom: 10,
            fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6
          }}>
            {pro.bio}
          </div>
        </>
      )}

      {/* INFOS */}
      <div className="dsect-title">Informations</div>
      <div className="pinfo-list" style={{ marginBottom: 14 }}>
        {pro.specialite && (
          <div className="pinfo-row">
            <span className="pi-key">Spécialité</span>
            <span className="pi-val">{pro.specialite}</span>
          </div>
        )}
        {pro.wilaya && (
          <div className="pinfo-row">
            <span className="pi-key">Wilaya</span>
            <span className="pi-val">{pro.wilaya}</span>
          </div>
        )}
        {pro.adresse && (
          <div className="pinfo-row">
            <span className="pi-key">Adresse</span>
            <span className="pi-val">{pro.adresse}</span>
          </div>
        )}
        {pro.telephone && (
          <div className="pinfo-row">
            <span className="pi-key">Téléphone</span>
            <span className="pi-val">{pro.telephone}</span>
          </div>
        )}
        {pro.tarif && (
          <div className="pinfo-row">
            <span className="pi-key">Tarif consultation</span>
            <span className="pi-val" style={{ color: 'var(--g)' }}>{pro.tarif} DA</span>
          </div>
        )}
        {pro.duree_rdv && (
          <div className="pinfo-row">
            <span className="pi-key">Durée consultation</span>
            <span className="pi-val">{pro.duree_rdv} min</span>
          </div>
        )}
        {pro.numero_ordre && (
          <div className="pinfo-row">
            <span className="pi-key">N° Ordre</span>
            <span className="pi-val">{pro.numero_ordre}</span>
          </div>
        )}
      </div>

      {/* LANGUES */}
      {pro.langues && pro.langues.length > 0 && (
        <>
          <div className="dsect-title">Langues parlées</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {pro.langues.map(l => (
              <span key={l} className="badge badge-g" style={{ padding: '6px 14px', fontSize: 13 }}>
                {langueLabel(l)}
              </span>
            ))}
          </div>
        </>
      )}

      {/* BOUTON RDV */}
      <button
        className="btn-submit"
        style={{ fontSize: 15, padding: 16, marginBottom: 8 }}
        onClick={() => nav('booking', { proId: pro.id })}
      >
        <Icon name="calendar" size={18} /> Prendre rendez-vous
      </button>
      <button
        className="btn-cancel"
        onClick={() => nav('search')}
      >
        <Icon name="chevronLeft" size={16} /> Retour à la recherche
      </button>

      <div className="pad-b" />
    </div>
  )
}