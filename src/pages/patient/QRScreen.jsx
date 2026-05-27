import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'

// ─── Helper : extrait l'image du QR canvas ───────────────────────────────────
function getQRDataUrl(qrRef) {
  return new Promise(resolve => {
    const img = qrRef.current?.querySelector('img')
    const canvas = qrRef.current?.querySelector('canvas')
    if (img?.src) { resolve(img.src); return }
    if (canvas) { resolve(canvas.toDataURL('image/png')); return }
    resolve(null)
  })
}

// ─── Toggle d'accès urgence ──────────────────────────────────────────────────
function UrgenceToggle({ dossier, userId, onToggle }) {
  const [active, setActive] = useState(dossier?.urgence_public || false)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const newVal = !active
    if (newVal && !dossier?.urgence_token) {
      const token = crypto.randomUUID()
      const { error } = await supabase
        .from('dossiers')
        .update({ urgence_public: true, urgence_token: token })
        .eq('patient_id', userId)
      if (!error) { setActive(true); if (onToggle) onToggle(true) }
    } else {
      const { error } = await supabase
        .from('dossiers')
        .update({ urgence_public: newVal })
        .eq('patient_id', userId)
      if (!error) { setActive(newVal); if (onToggle) onToggle(newVal) }
    }
    setLoading(false)
  }

  return (
    <div
      onClick={loading ? undefined : toggle}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: active ? 'var(--g)' : 'rgba(255,255,255,.1)',
        position: 'relative', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background .25s', flexShrink: 0,
        border: active ? '1px solid rgba(0,201,141,.4)' : '1px solid rgba(255,255,255,.15)',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: active ? 22 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left .25s',
        boxShadow: '0 1px 4px rgba(0,0,0,.3)',
      }} />
    </div>
  )
}

// ─── Écran QR Pass ───────────────────────────────────────────────────────────
export default function QRScreen({ nav, profile, dossierData }) {
  const { t } = useTranslation()
  const qrRef = useRef(null)
  const qrInstance = useRef(null)
  const [urgenceActive, setUrgenceActive] = useState(dossierData?.urgence_public === true)
  const [genWallpaper, setGenWallpaper] = useState(false)
  const [genCard, setGenCard] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const showLocalToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const qrText = dossierData?.urgence_token && dossierData?.urgence_public
    ? `https://vitapass.app/urgence/${dossierData.urgence_token}`
    : JSON.stringify({
        id: profile?.id,
        name: `${profile?.fname} ${profile?.lname}`,
        blood: profile?.blood,
        emergency: profile?.emergency,
      })

  useEffect(() => {
    if (!qrRef.current || !profile) return
    if (qrInstance.current) {
      qrInstance.current.clear()
      qrInstance.current.makeCode(qrText)
    } else if (window.QRCode) {
      qrInstance.current = new window.QRCode(qrRef.current, {
        text: qrText, width: 180, height: 180,
        colorDark: '#000', colorLight: '#fff',
      })
    }
  }, [profile, dossierData, qrText])

  // ── Génération fond d'écran 1080×1920 ────────────────────────────────────
  const downloadWallpaper = async () => {
    setGenWallpaper(true)
    try {
      await new Promise(r => setTimeout(r, 300))
      const qrDataUrl = await getQRDataUrl(qrRef)
      if (!qrDataUrl) {
        showLocalToast("QR non disponible — activez le QR Pass d'abord")
        setGenWallpaper(false)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
      grad.addColorStop(0, '#0a0a1a')
      grad.addColorStop(0.5, '#0d1b2a')
      grad.addColorStop(1, '#0a1628')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = 'rgba(0,201,141,0.07)'
      ctx.lineWidth = 2
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, 180 * i, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(0,201,141,0.18)'
      const cx = canvas.width / 2, cy = 300, cs = 70, ct = 24
      ctx.fillRect(cx - cs, cy - ct / 2, cs * 2, ct)
      ctx.fillRect(cx - ct / 2, cy - cs, ct, cs * 2)

      ctx.fillStyle = '#00C98D'
      ctx.font = 'bold 80px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('VitaPass', canvas.width / 2, 440)

      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '40px Arial, sans-serif'
      ctx.fillText("Dossier medical d'urgence", canvas.width / 2, 510)

      if (profile) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 56px Arial, sans-serif'
        ctx.fillText(`${profile.fname} ${profile.lname}`, canvas.width / 2, 620)
      }

      if (profile?.blood) {
        ctx.fillStyle = 'rgba(255,90,90,0.2)'
        ctx.beginPath()
        ctx.roundRect(canvas.width / 2 - 100, 648, 200, 52, 26)
        ctx.fill()
        ctx.fillStyle = '#FF8A8A'
        ctx.font = 'bold 30px Arial, sans-serif'
        ctx.fillText(`Groupe ${profile.blood}`, canvas.width / 2, 682)
      }

      const qrSize = 540
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 760
      ctx.shadowColor = '#00C98D'
      ctx.shadowBlur = 50
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(qrX, qrY, qrSize, qrSize, 30)
      ctx.fill()
      ctx.shadowBlur = 0

      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(r => { qrImg.onload = r; qrImg.onerror = r })
      ctx.drawImage(qrImg, qrX + 20, qrY + 20, qrSize - 40, qrSize - 40)

      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.font = '36px Arial, sans-serif'
      ctx.fillText("Scannez en cas d'urgence", canvas.width / 2, qrY + qrSize + 80)
      ctx.fillText('Aucune connexion requise', canvas.width / 2, qrY + qrSize + 130)

      ctx.fillStyle = 'rgba(0,201,141,0.4)'
      ctx.font = '28px Arial, sans-serif'
      ctx.fillText('vitapass.app', canvas.width / 2, canvas.height - 80)

      const link = document.createElement('a')
      link.download = 'vitapass-fond-ecran.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      showLocalToast("✅ Téléchargé — mettez-le en fond d'écran verrouillage")
    } catch (e) {
      console.error(e)
      showLocalToast('Erreur génération')
    } finally {
      setGenWallpaper(false)
    }
  }

  // ── Génération carte urgence format bancaire ──────────────────────────────
  const downloadCard = async () => {
    setGenCard(true)
    try {
      await new Promise(r => setTimeout(r, 300))
      const qrDataUrl = await getQRDataUrl(qrRef)
      if (!qrDataUrl) {
        showLocalToast("QR non disponible — activez le QR Pass d'abord")
        setGenCard(false)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = 1011
      canvas.height = 638
      const ctx = canvas.getContext('2d')

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      grad.addColorStop(0, '#0d1b2a')
      grad.addColorStop(1, '#1a3a5c')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }

      ctx.fillStyle = '#e63946'
      ctx.fillRect(0, 0, 14, canvas.height)

      const ccx = 76, ccy = 86, ccs = 30, cct = 11
      ctx.fillStyle = '#e63946'
      ctx.fillRect(ccx - ccs, ccy - cct / 2, ccs * 2, cct)
      ctx.fillRect(ccx - cct / 2, ccy - ccs, cct, ccs * 2)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 54px Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('VitaPass', 120, 100)

      ctx.fillStyle = '#e63946'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.fillText('URGENCE MEDICALE', 24, 148)

      if (profile) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 42px Arial, sans-serif'
        ctx.fillText(`${profile.fname} ${profile.lname}`, 24, 226)
      }

      ctx.font = '26px Arial, sans-serif'
      let infoY = 276
      if (profile?.blood) {
        ctx.fillStyle = '#FF8A8A'
        ctx.fillText(`Groupe sanguin : ${profile.blood}`, 24, infoY)
        infoY += 44
      }
      if (dossierData?.allergies) {
        const a = typeof dossierData.allergies === 'string'
          ? dossierData.allergies
          : JSON.stringify(dossierData.allergies)
        if (a && a !== '[]' && a !== 'null') {
          ctx.fillStyle = '#FFD166'
          ctx.fillText('Allergies - voir QR', 24, infoY)
          infoY += 44
        }
      }
      if (profile?.emergency) {
        ctx.fillStyle = '#00C98D'
        ctx.fillText(`Urgence : ${profile.emergency}`, 24, infoY)
      }

      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '20px Arial, sans-serif'
      ctx.fillText('Scannez le QR sans connexion', 24, canvas.height - 58)
      ctx.fillText('vitapass.app', 24, canvas.height - 28)

      const qrSize = 286
      const qrX = canvas.width - qrSize - 28
      const qrY = (canvas.height - qrSize) / 2
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14)
      ctx.fill()

      const qrImg = new Image()
      qrImg.src = qrDataUrl
      await new Promise(r => { qrImg.onload = r; qrImg.onerror = r })
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      const link = document.createElement('a')
      link.download = 'vitapass-carte-urgence.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      showLocalToast('✅ Carte téléchargée — imprimez en taille carte bancaire')
    } catch (e) {
      console.error(e)
      showLocalToast('Erreur génération')
    } finally {
      setGenCard(false)
    }
  }

  const btnStyle = (color, disabled) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
    background: disabled ? 'rgba(255,255,255,0.05)' : color,
    color: disabled ? 'var(--dim)' : (color === 'var(--g)' ? '#001A12' : '#fff'),
    fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .2s',
  })

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">{t('nav.qr')}</div>
      </div>

      {toastMsg && (
        <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,21,38,.97)', border: '1px solid rgba(0,201,141,.3)', color: '#EFF3FF', fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600, padding: '10px 18px', borderRadius: 20, zIndex: 300, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)', maxWidth: '90%', textAlign: 'center' }}>
          {toastMsg}
        </div>
      )}

      <div className="qr-wrap">
        <div className="emergency-bar">
          <span style={{ fontSize: 20 }}>{"🆘"}</span>
          <div className="emg-txt">{t('home.qr_pass_sub')}</div>
        </div>

        <div style={{ background: 'var(--card)', border: `1px solid ${urgenceActive ? 'rgba(0,201,141,.3)' : 'var(--border)'}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>
              {urgenceActive ? '🟢 Accès urgence activé' : '🔴 Accès urgence désactivé'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 3 }}>
              {urgenceActive
                ? 'QR lisible sans connexion par les secouristes'
                : 'Activer pour rendre le QR accessible aux secouristes'}
            </div>
          </div>
          <UrgenceToggle dossier={dossierData} userId={profile?.id} onToggle={setUrgenceActive} />
        </div>

        <div className="qr-card">
          <div className="qr-tag">URGENCE MÉDICALE</div>
          <div className="qr-box" ref={qrRef} />
          <div className="qr-pname">{profile?.fname} {profile?.lname}</div>
          <div className="qr-pinfo">{profile?.wilaya} · {profile?.cnas}</div>
          <div className="qr-chips">
            {profile?.blood && <span className="badge badge-r">{"🩸"} {profile.blood}</span>}
            {profile?.emergency && <span className="badge badge-g">{"📞"} {profile.emergency}</span>}
            {urgenceActive && <span className="badge badge-g">{"✅"} Public</span>}
          </div>
        </div>

        {urgenceActive && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
              Rendre le QR accessible hors ligne
            </div>

            <div style={{ background: 'var(--card2)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{"📱"}</span>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>
                    {"Fond d'écran verrouillage"}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                    Visible sans déverrouiller votre téléphone
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {["1. Télécharger", "2. Réglages", "3. Fond d'écran"].map((s, i) => (
                  <span key={i} style={{ background: 'rgba(0,201,141,.08)', color: 'var(--g)', border: '1px solid rgba(0,201,141,.15)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{s}</span>
                ))}
              </div>
              <button onClick={downloadWallpaper} disabled={genWallpaper} style={btnStyle('var(--g)', genWallpaper)}>
                {genWallpaper ? "⏳ Génération..." : "⬇ Télécharger le fond d'écran"}
              </button>
            </div>

            <div style={{ background: 'var(--card2)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{"🪪"}</span>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>
                    {"Carte d'urgence"}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                    Format carte bancaire — à glisser dans le portefeuille
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {["1. Télécharger", "2. Imprimer", "3. Découper"].map((s, i) => (
                  <span key={i} style={{ background: 'rgba(77,159,236,.08)', color: 'var(--blue)', border: '1px solid rgba(77,159,236,.15)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{s}</span>
                ))}
              </div>
              <button onClick={downloadCard} disabled={genCard} style={btnStyle('#1a3a5c', genCard)}>
                {genCard ? "⏳ Génération..." : "🖨 Télécharger la carte"}
              </button>
            </div>

            <div style={{ background: 'rgba(255,209,102,.06)', border: '1px solid rgba(255,209,102,.15)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: 'var(--yellow)', lineHeight: 1.6, margin: 0 }}>
                {"💡"} <strong>{"Conseil :"}</strong>{" Combinez les deux — fond d'écran sur votre téléphone + carte dans votre portefeuille pour une protection maximale."}
              </p>
            </div>
          </div>
        )}

        {!urgenceActive && (
          <div style={{ background: 'rgba(255,90,90,.06)', border: '1px solid rgba(255,90,90,.15)', borderRadius: 12, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
              {"Activez l'accès urgence ci-dessus pour débloquer le fond d'écran et la carte imprimable."}
            </p>
          </div>
        )}
      </div>
      <div className="pad-b" />
    </div>
  )
}
