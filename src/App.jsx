import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientRecord from './pages/doctor/PatientRecord';
import DoctorAppointments from './pages/doctor/DoctorAppointments';

const WILAYAS = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane']

const formatDate = d => {
  if (!d) return ''
  try { return new Intl.DateTimeFormat('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)) }
  catch { return d }
}

function getAvatarEmoji(gender, role) {
  if (role === 'doctor') return gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️';
  return gender === 'Féminin' ? '👩' : '👨';
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
:root{--bg:#080E1E;--card:#0D1526;--card2:#111C2E;--g:#00C98D;--blue:#4D9FEC;--yellow:#FFD166;--red:#FF5A5A;--white:#EFF3FF;--dim:#5A6A85;--border:rgba(255,255,255,.07)}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{font-family:'Inter',sans-serif;background:#1a1a2e}
.phone{width:390px;min-height:844px;background:var(--bg);border-radius:44px;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08);margin:auto}
.sbar{height:44px;background:var(--bg);display:flex;align-items:center;justify-content:space-between;padding:0 20px;flex-shrink:0;position:relative;z-index:10}
.sbar-time{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--white)}
.sbar-right{display:flex;align-items:center;gap:10px}
.screens{flex:1;overflow:hidden;position:relative}
.screen{position:absolute;inset:0;overflow-y:auto;flex-direction:column;padding:0 18px;gap:0}
.screen::-webkit-scrollbar{display:none}
.bnav{height:72px;background:var(--card);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;flex-shrink:0;padding-bottom:env(safe-area-inset-bottom)}
.ni{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:6px 12px;border-radius:12px;transition:all .2s;opacity:.45}
.ni svg{width:22px;height:22px;fill:var(--dim)}
.ni span{font-size:10px;font-family:'Syne',sans-serif;font-weight:600;color:var(--dim)}
.ni.active{opacity:1}
.ni.active svg{fill:var(--g)}
.ni.active span{color:var(--g)}
.auth-screen{position:absolute;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;z-index:100;border-radius:44px;padding:24px}
.auth-logo{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:8px}
.auth-title{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:var(--white)}
.auth-title span{color:var(--g)}
.auth-sub{font-size:13px;color:var(--dim)}
.auth-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:20px;width:100%}
.auth-tabs{display:flex;background:var(--card2);border-radius:10px;padding:3px;margin-bottom:16px;gap:2px}
.auth-tab{flex:1;text-align:center;padding:8px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--dim);border-radius:8px;cursor:pointer}
.auth-tab.active{background:var(--g);color:#001A12}
.role-select{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.role-btn{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s}
.role-btn.selected{border-color:var(--g);background:rgba(0,201,141,.08)}
.role-icon{font-size:22px}
.role-label{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--white)}
.role-sub{font-size:11px;color:var(--dim);margin-top:2px}
.pwd-wrap{position:relative}
.pwd-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;opacity:0.6;user-select:none}
.splash{position:absolute;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;z-index:100;border-radius:44px}
.sp-logo{display:flex;flex-direction:column;align-items:center;gap:12px}
.sp-icon{animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.sp-name{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:var(--white)}
.sp-name span{color:var(--g)}
.sp-sub{font-size:13px;color:var(--dim);letter-spacing:.5px}
.sp-bar{width:160px;height:3px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
.sp-fill{height:100%;background:var(--g);border-radius:4px;animation:fill 2s ease-out forwards}
@keyframes fill{from{width:0}to{width:100%}}
.home-hdr{padding:16px 0 4px}
.h-greet{font-size:13px;color:var(--dim)}
.h-name{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--white);margin-top:2px}
.h-name span{color:var(--g)}
.vitacard{background:linear-gradient(135deg,#003D2A 0%,#001A12 100%);border:1px solid rgba(0,201,141,.2);border-radius:20px;padding:20px;margin:14px 0;cursor:pointer;position:relative;overflow:hidden}
.vitacard::before{content:'';position:absolute;inset:-1px;background:linear-gradient(135deg,rgba(0,201,141,.15),transparent 60%);border-radius:20px;pointer-events:none}
.vc-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.vc-logo{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--g)}
.vc-blood{background:rgba(255,90,90,.2);color:#FF8A8A;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,90,90,.3)}
.vc-name{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--white)}
.vc-info{font-size:11px;color:rgba(255,255,255,.45);margin-top:4px}
.vc-bottom{display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px}
.vc-id{font-size:11px;color:rgba(0,201,141,.5);font-family:'Syne',sans-serif;letter-spacing:1px}
.alert-chip{background:rgba(255,209,102,.08);border:1px solid rgba(255,209,102,.2);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px}
.alert-dot{width:7px;height:7px;border-radius:50%;background:var(--yellow);flex-shrink:0;animation:blink 1.5s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.alert-txt{font-size:12px;color:rgba(255,255,255,.7);line-height:1.4}
.sec-label{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin:14px 0 8px}
.qstats{display:flex;gap:10px;margin-bottom:4px}
.qs{flex:1;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 10px;text-align:center;cursor:pointer;transition:all .2s}
.qs:active{transform:scale(.97)}
.qs-icon{font-size:20px;margin-bottom:6px}
.qs-val{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--white)}
.qs-lbl{font-size:10px;color:var(--dim);margin-top:2px;font-family:'Syne',sans-serif;font-weight:600}
.action-list{display:flex;flex-direction:column;gap:8px}
.action-row{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s}
.action-row:active{transform:scale(.98)}
.ar-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.ar-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--white)}
.ar-sub{font-size:11px;color:var(--dim);margin-top:2px}
.ar-text{flex:1}
.ar-arrow{font-size:20px;color:var(--dim)}
.pad-b{height:24px}
.screen-hdr{display:flex;align-items:center;gap:12px;padding:14px 0 8px}
.back-btn{width:36px;height:36px;background:var(--card2);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:var(--white)}
.shdr-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--white)}
.qr-wrap{display:flex;flex-direction:column;gap:14px}
.emergency-bar{background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.25);border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:12px}
.emg-txt{font-size:12px;color:rgba(255,255,255,.7);line-height:1.4;flex:1}
.qr-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:10px}
.qr-tag{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--red);letter-spacing:2px;background:rgba(255,90,90,.1);padding:4px 12px;border-radius:20px;border:1px solid rgba(255,90,90,.2)}
.qr-box{width:190px;height:190px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.qr-pname{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--white)}
.qr-pinfo{font-size:11px;color:var(--dim);text-align:center}
.qr-chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.qr-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.qa-btn{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.qa-icon{font-size:20px}
.qa-lbl{font-size:10px;color:var(--dim);font-family:'Syne',sans-serif;font-weight:600}
.badge{font-size:10px;font-family:'Syne',sans-serif;font-weight:700;padding:3px 8px;border-radius:20px}
.badge-g{background:rgba(0,201,141,.12);color:var(--g);border:1px solid rgba(0,201,141,.2)}
.badge-r{background:rgba(255,90,90,.12);color:#FF8A8A;border:1px solid rgba(255,90,90,.2)}
.badge-y{background:rgba(255,209,102,.12);color:var(--yellow);border:1px solid rgba(255,209,102,.2)}
.tabs{display:flex;background:var(--card);border-radius:12px;padding:4px;margin-bottom:4px;gap:2px}
.tab{flex:1;text-align:center;padding:8px 4px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--dim);border-radius:9px;cursor:pointer;transition:all .2s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tab.active{background:var(--card2);color:var(--g);box-shadow:0 2px 8px rgba(0,0,0,.3)}
.dsect-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--dim);letter-spacing:.8px;text-transform:uppercase;margin:12px 0 8px}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:8px}
.card-row{display:flex;align-items:center;gap:12px}
.card-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.card-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--white)}
.card-sub{font-size:11px;color:var(--dim);margin-top:3px}
.card-info{flex:1}
.allergy-wrap{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px}
.achip{background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.2);color:#FF8A8A;font-size:12px;font-family:'Syne',sans-serif;font-weight:600;padding:6px 12px;border-radius:20px;display:flex;align-items:center;gap:6px}
.achip-rm{cursor:pointer;opacity:.6;font-size:14px}
.add-btn{background:rgba(0,201,141,.08);border:1px dashed rgba(0,201,141,.3);border-radius:12px;padding:12px;text-align:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--g);cursor:pointer;margin:8px 0;transition:all .2s}
.add-btn:active{background:rgba(0,201,141,.15)}
.empty-state{text-align:center;padding:30px 20px;color:var(--dim)}
.empty-icon{font-size:36px;margin-bottom:10px}
.profile-hero{background:linear-gradient(180deg,rgba(0,201,141,.08) 0%,transparent 100%);padding:20px 0;display:flex;flex-direction:column;align-items:center;gap:8px;border-bottom:1px solid var(--border);margin:0 -18px;padding-left:18px;padding-right:18px}
.p-av-wrap{position:relative}
.p-av{width:72px;height:72px;background:rgba(0,201,141,.1);border:2px solid rgba(0,201,141,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px}
.p-badge{position:absolute;bottom:0;right:0;background:var(--g);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid var(--bg)}
.p-name{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--white)}
.p-id{font-size:11px;color:var(--dim);letter-spacing:.5px}
.p-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.pchip{background:var(--card2);border:1px solid var(--border);border-radius:20px;font-size:11px;font-family:'Syne',sans-serif;font-weight:600;color:var(--dim);padding:4px 10px}
.pinfo-list{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.pinfo-row{display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)}
.pinfo-row:last-child{border-bottom:none}
.pi-key{font-size:12px;color:var(--dim)}
.pi-val{font-size:12px;font-weight:600;color:var(--white);font-family:'Syne',sans-serif;text-align:right;max-width:60%}
.logout-btn{background:rgba(255,90,90,.08);border:1px solid rgba(255,90,90,.2);border-radius:14px;padding:14px;text-align:center;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#FF8A8A;cursor:pointer;margin-bottom:24px}
.modal-overlay{position:absolute;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;z-index:50;backdrop-filter:blur(4px)}
.modal{background:#0D1829;border-radius:24px 24px 0 0;padding:20px 20px 32px;width:100%;max-height:85%;overflow-y:auto;border-top:1px solid rgba(255,255,255,.1)}
.modal::-webkit-scrollbar{display:none}
.modal-handle{width:36px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;margin:0 auto 16px}
.modal-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:var(--white);margin-bottom:16px}
.form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;flex:1}
.form-row{display:flex;gap:10px}
.form-label{font-size:11px;font-family:'Syne',sans-serif;font-weight:700;color:var(--dim);letter-spacing:.5px}
.form-input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 13px;font-size:14px;color:var(--white);outline:none;font-family:'Inter',sans-serif;width:100%}
.form-input:focus{border-color:rgba(0,201,141,.4);background:rgba(0,201,141,.05)}
.form-select{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 13px;font-size:13px;color:var(--white);outline:none;font-family:'Inter',sans-serif;width:100%}
.btn-submit{width:100%;background:var(--g);color:#001A12;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-bottom:8px}
.btn-cancel{width:100%;background:transparent;color:var(--dim);font-family:'Syne',sans-serif;font-size:13px;font-weight:600;padding:10px;border-radius:12px;border:1px solid var(--border);cursor:pointer}
.toast{position:absolute;top:60px;left:50%;transform:translateX(-50%);background:rgba(13,21,38,.95);border:1px solid rgba(0,201,141,.3);color:var(--white);font-family:'Syne',sans-serif;font-size:13px;font-weight:600;padding:10px 20px;border-radius:20px;z-index:200;white-space:nowrap;backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.error-msg{background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.2);border-radius:10px;padding:10px 14px;font-size:12px;color:#FF8A8A;margin-bottom:12px;text-align:center}
.loading{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--dim);font-size:13px;padding:20px}
.divider{height:1px;background:var(--border);margin:14px 0}
.vacc-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)}
.vacc-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--white)}
.vacc-date{font-size:11px;color:var(--dim);margin-top:3px}
.vacc-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px}
.mini-chart{display:flex;align-items:flex-end;gap:3px;height:50px;margin-bottom:8px}
.bar{flex:1;background:rgba(0,201,141,.2);border-radius:3px 3px 0 0;transition:height .3s}
.bar.hi{background:var(--g)}
.metric-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px;cursor:pointer}
.mc-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.mc-left{display:flex;align-items:center;gap:10px}
.mc-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--white)}
.mc-sub{font-size:11px;color:var(--dim);margin-top:2px}
.mc-val{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--g)}
.mc-unit{font-size:12px;color:var(--dim)}
.mc-trend{font-size:11px;color:var(--g);font-family:'Syne',sans-serif;font-weight:600}
.mc-trend.warn{color:var(--yellow)}
.doc-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px}
.doc-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
.doc-name{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--white)}
.doc-spec{font-size:12px;color:var(--blue);margin-top:2px}
.doc-loc{font-size:11px;color:var(--dim);margin-top:3px}
.doc-btn{padding:6px 10px;border-radius:8px;border:none;cursor:pointer;font-size:13px}
`

const styleEl = document.createElement('style')
styleEl.textContent = CSS
document.head.appendChild(styleEl)

const qrScript = document.createElement('script')
qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
document.head.appendChild(qrScript)

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}

function Toast({ msg }) { return <div className="toast">{msg}</div> }

function MiniChart({ data }) {
  if (!data || data.length === 0) return <div className="mini-chart" />
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  return (
    <div className="mini-chart">
      {data.map((v, i) => (
        <div key={i} className={`bar${i === data.length - 1 ? ' hi' : ''}`} style={{ height: `${20 + ((v - min) / range) * 70}%` }} />
      ))}
    </div>
  )
}

function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    { id: 'patient', icon: '🧑‍💼', label: 'Patient', sub: 'Gérer mon dossier médical' },
    { id: 'doctor', icon: '👨‍⚕️', label: 'Médecin', sub: 'Accéder aux dossiers patients' },
  ]

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!fname || !lname || !email || !password) { setError('Tous les champs sont requis'); return }
    if (password.length < 6) { setError('Mot de passe minimum 6 caractères'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role, fname, lname } }
    })
    if (error) setError(error.message)
    else setError('✅ Compte créé ! Vérifiez votre email pour confirmer.')
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <svg width="60" height="60" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5"/>
          <circle cx="55" cy="55" r="44" fill="#0A1628"/>
          <path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg)"/>
          <defs><linearGradient id="sg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#00C98D"/><stop offset="1" stopColor="#005E42"/></linearGradient></defs>
        </svg>
        <div className="auth-title">Vita<span>Pass</span></div>
        <div className="auth-sub">Carnet de santé digital algérien</div>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <div className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Connexion</div>
          <div className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => setTab('signup')}>Inscription</div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {tab === 'signup' && (
          <>
            <div className="sec-label" style={{ margin: '0 0 8px' }}>Je suis</div>
            <div className="role-select">
              {roles.map(r => (
                <div key={r.id} className={`role-btn${role === r.id ? ' selected' : ''}`} onClick={() => setRole(r.id)}>
                  <span className="role-icon">{r.icon}</span>
                  <div><div className="role-label">{r.label}</div><div className="role-sub">{r.sub}</div></div>
                </div>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input className="form-input" placeholder="Karim" value={fname} onChange={e => setFname(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" placeholder="Bensalem" value={lname} onChange={e => setLname(e.target.value)} />
              </div>
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="email@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <div className="pwd-wrap">
            <input className="form-input" type={showPwd ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
            <span className="pwd-eye" onClick={() => setShowPwd(!showPwd)}>{showPwd ? "🙈" : "👁️"}</span>
          </div>
        </div>
        <button className="btn-submit" onClick={tab === 'login' ? handleLogin : handleSignup} disabled={loading}>
          {loading ? '⏳ Chargement...' : tab === 'login' ? '🔐 Se connecter' : '✨ Créer mon compte'}
        </button>
      </div>
    </div>
  )
}
function HomeScreen({ nav, profile, dossier }) {
  const meds = dossier?.meds || []

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="home-hdr">
        <div className="h-greet">Bonjour 👋</div>
        <div className="h-name">{profile?.fname} <span>{profile?.lname}</span></div>
      </div>
      <div className="vitacard" onClick={() => nav('qr')}>
        <div className="vc-top">
          <span className="vc-logo">🏥 VitaPass</span>
          {profile?.blood && <span className="vc-blood">{profile.blood}</span>}
        </div>
        <div className="vc-name">{profile?.fname} {profile?.lname}</div>
        <div className="vc-info">{profile?.wilaya} · {profile?.cnas || 'CNAS non renseigné'}</div>
        <div className="vc-bottom">
          <span className="vc-id">VP-DZ-{profile?.id?.slice(0,8)?.toUpperCase()}</span>
          <span style={{ fontSize: 11, color: 'rgba(0,201,141,.5)' }}>Appuyer pour QR →</span>
        </div>
      </div>
      <div className="sec-label">Mon résumé santé</div>
      <div className="qstats">
        <div className="qs" onClick={() => nav('dossier')}>
          <div className="qs-icon">💊</div>
          <div className="qs-val">{meds.length}</div>
          <div className="qs-lbl">Traitements</div>
        </div>
        <div className="qs" onClick={() => nav('doctors')}>
          <div className="qs-icon">👨‍⚕️</div>
          <div className="qs-val">0</div>
          <div className="qs-lbl">Médecins</div>
        </div>
        <div className="qs" onClick={() => nav('suivi')}>
          <div className="qs-icon">📊</div>
          <div className="qs-val">–</div>
          <div className="qs-lbl">Métriques</div>
        </div>
      </div>
      <div className="sec-label">Accès rapide</div>
      <div className="action-list">
        <div className="action-row" onClick={() => nav('qr')}>
          <div className="ar-icon" style={{ background: 'rgba(255,90,90,.1)' }}>🆘</div>
          <div className="ar-text"><div className="ar-title">Mon QR Pass</div><div className="ar-sub">Partager mes infos en urgence</div></div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('dossier')}>
          <div className="ar-icon" style={{ background: 'rgba(77,159,236,.1)' }}>📋</div>
          <div className="ar-text"><div className="ar-title">Mon dossier</div><div className="ar-sub">Médicaments, antécédents...</div></div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('doctors')}>
          <div className="ar-icon" style={{ background: 'rgba(0,201,141,.1)' }}>👨‍⚕️</div>
          <div className="ar-text"><div className="ar-title">Mes médecins</div><div className="ar-sub">Accès & rendez-vous</div></div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('suivi')}>
          <div className="ar-icon" style={{ background: 'rgba(255,209,102,.1)' }}>❤️</div>
          <div className="ar-text"><div className="ar-title">Mon suivi</div><div className="ar-sub">Glycémie, tension, poids</div></div>
          <span className="ar-arrow">›</span>
        </div>
      </div>
      <div className="pad-b" />
    </div>
  )
}

function QRScreen({ nav, profile, dossier }) {
  const qrRef = useRef(null)
  const qrInstance = useRef(null)

  useEffect(() => {
    if (!qrRef.current || !profile) return
    if (qrInstance.current) { qrInstance.current.clear(); qrInstance.current.makeCode(JSON.stringify({ id: profile.id, name: `${profile.fname} ${profile.lname}`, blood: profile.blood, emergency: profile.emergency })) }
    else if (window.QRCode) {
      qrInstance.current = new window.QRCode(qrRef.current, { text: JSON.stringify({ id: profile.id, name: `${profile.fname} ${profile.lname}`, blood: profile.blood, emergency: profile.emergency }), width: 180, height: 180, colorDark: '#000', colorLight: '#fff' })
    }
  }, [profile])

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">Mon QR Pass</div></div>
      <div className="qr-wrap">
        <div className="emergency-bar">
          <span style={{ fontSize: 20 }}>🆘</span>
          <div className="emg-txt">En cas d'urgence, ce QR code permet aux secours d'accéder à vos informations vitales</div>
        </div>
        <div className="qr-card">
          <div className="qr-tag">URGENCE MÉDICALE</div>
          <div className="qr-box" ref={qrRef} />
          <div className="qr-pname">{profile?.fname} {profile?.lname}</div>
          <div className="qr-pinfo">{profile?.wilaya} · {profile?.cnas}</div>
          <div className="qr-chips">
            {profile?.blood && <span className="badge badge-r">🩸 {profile.blood}</span>}
            {profile?.emergency && <span className="badge badge-g">📞 {profile.emergency}</span>}
          </div>
        </div>
      </div>
      <div className="pad-b" />
    </div>
  )
}

function DossierScreen({ nav, dossier, onSave, showToast }) {
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

  const DOC_TYPES = {
    ordonnance: { label: 'Ordonnance', icon: '💊' },
    analyse: { label: 'Analyse', icon: '🧪' },
    radio: { label: 'Radiologie', icon: '🩻' },
    compte_rendu: { label: 'Compte rendu', icon: '📋' },
    autre: { label: 'Autre', icon: '📄' },
  }

  useEffect(() => { if (activeTab === 'docs') loadDocs() }, [activeTab])

  const loadDocs = async () => {
    setDocsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('documents').select('*').eq('patient_id', user.id).order('created_at', { ascending: false })
    setPatientDocs(data || [])
    setDocsLoading(false)
  }

  const handleOpenDoc = (doc) => { if (doc.file_url) window.open(doc.file_url, '_blank') }

  const handleDeleteDoc = async (doc) => {
    if (!confirm('Supprimer ce document ?')) return
    await supabase.from('documents').delete().eq('id', doc.id)
    loadDocs()
    showToast('Document supprimé')
  }

  const handleUpload = async () => {
    if (!docFile) { setDocError('Fichier requis'); return }
    if (!docForm.title) { setDocError('Nom requis'); return }
    setUploadingDoc(true); setDocError('')
    const { data: { user } } = await supabase.auth.getUser()
    const ext = docFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, docFile)
    if (upErr) { setDocError('Erreur upload: ' + upErr.message); setUploadingDoc(false); return }
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    await supabase.from('documents').insert({ patient_id: user.id, title: docForm.title, type: docForm.type, date: docForm.date || null, medecin: docForm.medecin || null, file_url: publicUrl })
    setShowUploadModal(false); setDocFile(null); setDocForm({ title: '', type: 'ordonnance', date: '', medecin: '' })
    loadDocs(); showToast('✅ Document ajouté')
    setUploadingDoc(false)
  }

  const addMed = async () => {
    if (!form.name) return
    setSaving(true)
    await onSave({ meds: [...meds, { id: Date.now(), ...form }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅ Médicament ajouté')
  }

  const addAllergy = async () => {
    if (!form.name) return
    setSaving(true)
    await onSave({ allergies: [...allergies, { id: Date.now(), name: form.name }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅ Allergie ajoutée')
  }

  const removeAllergy = async (id) => {
    await onSave({ allergies: allergies.filter(a => a.id !== id) })
    showToast('Allergie supprimée')
  }

  const addAnt = async () => {
    if (!form.name) return
    setSaving(true)
    await onSave({ antecedents: [...antecedents, { id: Date.now(), ...form }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅ Antécédent ajouté')
  }

  const addVacc = async () => {
    if (!form.name) return
    setSaving(true)
    await onSave({ vaccins: [...vaccins, { id: Date.now(), ...form }] })
    setModal(null); setForm({}); setSaving(false); showToast('✅ Vaccin ajouté')
  }

  const tabs = [
    { id: 'med', label: '💊 Médic.' },
    { id: 'allergy', label: '⚠️ Allergies' },
    { id: 'ant', label: '🩺 Antéc.' },
    { id: 'vacc', label: '💉 Vaccins' },
    { id: 'docs', label: '📄 Docs' },
  ]

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">Mon Dossier</div></div>
      <div className="tabs">
        {tabs.map(t => <div key={t.id} className={`tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</div>)}
      </div>

      {activeTab === 'med' && <>
        <div className="dsect-title">Médicaments en cours</div>
        {meds.length === 0
          ? <div className="empty-state"><div className="empty-icon">💊</div><p>Aucun médicament enregistré</p></div>
          : meds.map(m => (
            <div key={m.id} className="card">
              <div className="card-row">
                <div className="card-icon" style={{ background: 'rgba(77,159,236,.1)' }}>💊</div>
                <div className="card-info"><div className="card-name">{m.name}</div><div className="card-sub">{m.dose}{m.reason ? ' · ' + m.reason : ''}</div></div>
                <span className="badge badge-g">Actif</span>
              </div>
            </div>
          ))}
        <div className="add-btn" onClick={() => { setModal('med'); setForm({}) }}>＋ Ajouter un médicament</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'allergy' && <>
        <div className="dsect-title">Mes allergies</div>
        <div className="allergy-wrap">
          {allergies.length === 0
            ? <div className="empty-state"><div className="empty-icon">⚠️</div><p>Aucune allergie enregistrée</p></div>
            : allergies.map(a => (
              <div key={a.id} className="achip">{a.name}<span className="achip-rm" onClick={() => removeAllergy(a.id)}>✕</span></div>
            ))}
        </div>
        <div className="add-btn" onClick={() => { setModal('allergy'); setForm({}) }}>＋ Ajouter une allergie</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'ant' && <>
        <div className="dsect-title">Antécédents médicaux</div>
        {antecedents.length === 0
          ? <div className="empty-state"><div className="empty-icon">📋</div><p>Aucun antécédent enregistré</p></div>
          : antecedents.map(a => (
            <div key={a.id} className="card">
              <div className="card-row">
                <div className="card-icon" style={{ background: 'rgba(255,209,102,.1)' }}>🩺</div>
                <div className="card-info"><div className="card-name">{a.name}</div><div className="card-sub">{a.type}{a.year ? ' · ' + a.year : ''}</div></div>
                <span className="badge badge-r">{a.type}</span>
              </div>
            </div>
          ))}
        <div className="add-btn" onClick={() => { setModal('ant'); setForm({ type: 'Chronique' }) }}>＋ Ajouter un antécédent</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'vacc' && <>
        <div className="dsect-title">Carnet vaccinal</div>
        {vaccins.map(v => (
          <div key={v.id} className="vacc-row">
            <div><div className="vacc-name">{v.name}</div><div className="vacc-date">{v.date ? formatDate(v.date) : 'Recommandé'}</div></div>
            <div className="vacc-ico" style={{ background: v.status === 'done' ? 'rgba(0,201,141,.15)' : 'rgba(255,209,102,.15)' }}>{v.status === 'done' ? '✅' : '⏳'}</div>
          </div>
        ))}
        <div className="add-btn" onClick={() => { setModal('vacc'); setForm({ status: 'done' }) }}>＋ Ajouter un vaccin</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'docs' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontWeight:600, color:'var(--white)' }}>📄 Mes Documents ({patientDocs.length})</span>
            <div className="add-btn" style={{ margin:0, padding:'6px 12px' }} onClick={() => setShowUploadModal(true)}>+ Ajouter</div>
          </div>
          {docsLoading ? <p style={{ color:'var(--dim)' }}>Chargement...</p> : patientDocs.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'var(--dim)' }}>
              <div style={{ fontSize:40 }}>📂</div>
              <div>Aucun document</div>
            </div>
          ) : patientDocs.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-top">
                <span style={{ fontSize:20 }}>{DOC_TYPES[doc.type]?.icon || '📄'}</span>
                <div style={{ flex:1, marginLeft:8 }}>
                  <div className="doc-name">{doc.title}</div>
                  <div className="doc-spec">{DOC_TYPES[doc.type]?.label} · {doc.date}</div>
                  {doc.medecin && <div className="doc-loc">Dr. {doc.medecin}</div>}
                </div>
                <button className="doc-btn" style={{ background:'rgba(77,159,236,.1)', color:'var(--blue)' }} onClick={() => handleOpenDoc(doc)}>👁</button>
                <button className="doc-btn" style={{ marginLeft:4, background:'rgba(255,90,90,.1)', color:'#FF8A8A' }} onClick={() => handleDeleteDoc(doc)}>🗑</button>
              </div>
            </div>
          ))}
          {showUploadModal && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowUploadModal(false)}>
              <div className="modal">
                <div className="modal-handle" />
                <div className="modal-title">Ajouter un document</div>
                <div className="form-group">
                  <label className="form-label">Fichier *</label>
                  <div onClick={() => docInputRef.current.click()} style={{ border:'2px dashed rgba(255,255,255,.15)', borderRadius:8, padding:16, textAlign:'center', cursor:'pointer', background: docFile ? 'rgba(0,201,141,.05)' : 'transparent' }}>
                    <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => { const f = e.target.files[0]; if(f){ setDocFile(f); if(!docForm.title) setDocForm(p => ({...p, title: f.name.replace(/\.[^/.]+$/,'')})) }}} />
                    {docFile ? <span style={{ color:'var(--g)' }}>✅ {docFile.name}</span> : <span style={{ color:'var(--dim)' }}>📂 Appuie pour choisir<br/><small>PDF, JPG, PNG · max 10 Mo</small></span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={docForm.title} onChange={e => setDocForm(p => ({...p, title: e.target.value}))} placeholder="Ex: Ordonnance Dr. Benali" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={docForm.type} onChange={e => setDocForm(p => ({...p, type: e.target.value}))}>
                    {Object.entries(DOC_TYPES).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={docForm.date} onChange={e => setDocForm(p => ({...p, date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Médecin (optionnel)</label>
                  <input className="form-input" value={docForm.medecin} onChange={e => setDocForm(p => ({...p, medecin: e.target.value}))} placeholder="Dr. Benali" />
                </div>
                {docError && <div style={{ color:'#FF8A8A', fontSize:13, padding:'8px 0' }}>⚠️ {docError}</div>}
                <button className="btn-submit" onClick={handleUpload} disabled={uploadingDoc}>{uploadingDoc ? '⏳ Upload...' : '⬆️ Envoyer'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {modal === 'med' && <Modal title="Ajouter un médicament" onClose={() => setModal(null)}>
        <div className="form-group"><label className="form-label">Nom</label><input className="form-input" placeholder="Metformine 850mg" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Posologie</label><input className="form-input" placeholder="2x/jour" onChange={e => setForm({ ...form, dose: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Indication</label><input className="form-input" placeholder="Diabète" onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
        </div>
        <button className="btn-submit" onClick={addMed} disabled={saving}>{saving ? '⏳...' : 'Enregistrer'}</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}

      {modal === 'allergy' && <Modal title="Ajouter une allergie" onClose={() => setModal(null)}>
        <div className="form-group"><label className="form-label">Allergie</label><input className="form-input" placeholder="Pénicilline" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <button className="btn-submit" onClick={addAllergy} disabled={saving}>{saving ? '⏳...' : 'Enregistrer'}</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}

      {modal === 'ant' && <Modal title="Ajouter un antécédent" onClose={() => setModal(null)}>
        <div className="form-group"><label className="form-label">Condition</label><input className="form-input" placeholder="Diabète de type 2" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Année</label><input className="form-input" type="number" placeholder="2018" onChange={e => setForm({ ...form, year: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-select" onChange={e => setForm({ ...form, type: e.target.value })}>
              {['Chronique','Hospitalisation','Chirurgie','Autre'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-submit" onClick={addAnt} disabled={saving}>{saving ? '⏳...' : 'Enregistrer'}</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}

      {modal === 'vacc' && <Modal title="Ajouter un vaccin" onClose={() => setModal(null)}>
        <div className="form-group"><label className="form-label">Vaccin</label><input className="form-input" placeholder="BCG, Covid-19..." onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Statut</label>
            <select className="form-select" onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="done">✅ Fait</option><option value="pending">⏳ À faire</option>
            </select>
          </div>
        </div>
        <button className="btn-submit" onClick={addVacc} disabled={saving}>{saving ? '⏳...' : 'Enregistrer'}</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}
    </div>
  )
}

function SuiviScreen({ nav, dossier, onSave, showToast }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const glyc = dossier?.glyc || []
  const bp = dossier?.bp || []
  const weight = dossier?.weight || []
  const lastGlyc = glyc.length > 0 ? glyc[glyc.length - 1] : null
  const lastBp = bp.length > 0 ? bp[bp.length - 1] : null
  const lastW = weight.length > 0 ? weight[weight.length - 1] : null
  const today = new Date().toISOString().split('T')[0]

  const saveMetric = async () => {
    if (modal === 'glyc') { const v = parseFloat(form.val); if (!v) return; await onSave({ glyc: [...glyc, v].slice(-7) }) }
    else if (modal === 'bp') { const s = parseInt(form.s), d = parseInt(form.d); if (!s||!d) return; await onSave({ bp: [...bp, {s,d}].slice(-7) }) }
    else if (modal === 'weight') { const v = parseFloat(form.val); if (!v) return; await onSave({ weight: [...weight, v].slice(-7) }) }
    setModal(null); setForm({}); showToast('✅ Mesure sauvegardée')
  }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">Mon Suivi Santé</div></div>
      <div className="sec-label">Métriques médicales</div>
      <div className="metric-card" onClick={() => { setModal('glyc'); setForm({ date: today }) }}>
        <div className="mc-hdr"><div className="mc-left"><span style={{ fontSize: 22 }}>🩸</span><div><div className="mc-title">Glycémie (HbA1c)</div><div className="mc-sub">Appuyer pour ajouter</div></div></div><div><span className="mc-val">{lastGlyc ?? '--'}</span><span className="mc-unit"> %</span></div></div>
        <MiniChart data={glyc} />
        <div className={`mc-trend${lastGlyc && lastGlyc >= 7.5 ? ' warn' : ''}`}>{lastGlyc ? (lastGlyc < 7.5 ? '↓ Dans les objectifs' : '↗️ Élevé · Surveiller') : '+ Ajouter une mesure'}</div>
      </div>
      <div className="metric-card" onClick={() => { setModal('bp'); setForm({ date: today }) }}>
        <div className="mc-hdr"><div className="mc-left"><span style={{ fontSize: 22 }}>❤️</span><div><div className="mc-title">Tension artérielle</div><div className="mc-sub">mmHg · Appuyer pour ajouter</div></div></div><div><span className="mc-val">{lastBp ? lastBp.s : '--'}</span><span className="mc-unit">{lastBp ? '/'+lastBp.d : ''}</span></div></div>
        <MiniChart data={bp.map(b => b.s)} />
        <div className={`mc-trend${lastBp && lastBp.s > 130 ? ' warn' : ''}`}>{lastBp ? (lastBp.s > 130 ? '↗️ Élevé · Surveiller' : '↓ Normal') : '+ Ajouter une mesure'}</div>
      </div>
      <div className="metric-card" onClick={() => { setModal('weight'); setForm({ date: today }) }}>
        <div className="mc-hdr"><div className="mc-left"><span style={{ fontSize: 22 }}>⚖️</span><div><div className="mc-title">Poids corporel</div><div className="mc-sub">kg · Appuyer pour ajouter</div></div></div><div><span className="mc-val">{lastW ?? '--'}</span><span className="mc-unit"> kg</span></div></div>
        <MiniChart data={weight} />
        <div className="mc-trend">{lastW && weight.length > 1 ? `${weight[0] > lastW ? '↓' : '↑'} ${Math.abs(weight[0] - lastW).toFixed(1)}kg` : '+ Ajouter une mesure'}</div>
      </div>
      <div className="pad-b" />
      {modal === 'glyc' && <Modal title="Glycémie (HbA1c)" onClose={() => setModal(null)}>
        <div className="form-group"><label className="form-label">Valeur (%)</label><input className="form-input" type="number" step="0.1" placeholder="7.2" onChange={e => setForm({ ...form, val: e.target.value })} /></div>
        <button className="btn-submit" onClick={saveMetric}>Enregistrer</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}
      {modal === 'bp' && <Modal title="Tension artérielle" onClose={() => setModal(null)}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Systolique</label><input className="form-input" type="number" placeholder="128" onChange={e => setForm({ ...form, s: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Diastolique</label><input className="form-input" type="number" placeholder="82" onChange={e => setForm({ ...form, d: e.target.value })} /></div>
        </div>
        <button className="btn-submit" onClick={saveMetric}>Enregistrer</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}
      {modal === 'weight' && <Modal title="Poids corporel" onClose={() => setModal(null)}>
        <div className="form-group"><label className="form-label">Poids (kg)</label><input className="form-input" type="number" step="0.1" placeholder="82" onChange={e => setForm({ ...form, val: e.target.value })} /></div>
        <button className="btn-submit" onClick={saveMetric}>Enregistrer</button>
        <button className="btn-cancel" onClick={() => setModal(null)}>Annuler</button>
      </Modal>}
    </div>
  )
}

function DoctorsScreen({ nav, showToast }) {
  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">Médecins & Accès</div></div>
      <div className="empty-state" style={{ marginTop: 40 }}>
        <div className="empty-icon">👨‍⚕️</div>
        <p>Aucun médecin autorisé</p>
        <p style={{ marginTop: 8, fontSize: 12 }}>Les médecins que vous autorisez pourront accéder à votre dossier</p>
      </div>
      <div className="add-btn" onClick={() => showToast('🚧 Bientôt disponible')}>＋ Autoriser un médecin</div>
      <div className="pad-b" />
    </div>
  )
}

function ProfileScreen({ nav, profile, setProfile, onLogout, showToast }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(profile || {})
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      fname: form.fname, lname: form.lname, dob: form.dob,
      gender: form.gender, wilaya: form.wilaya, blood: form.blood,
      cnas: form.cnas, emergency: form.emergency
    }).eq('id', profile.id)
    if (!error) { setProfile({ ...profile, ...form }); setModal(false); showToast('✅ Profil mis à jour') }
    setSaving(false)
  }

  const age = profile?.dob ? new Date().getFullYear() - parseInt(profile.dob.split('-')[0]) : ''
  const avatarEmoji = getAvatarEmoji(profile?.gender, 'patient')

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="profile-hero">
        <div className="p-av-wrap">
          <div className="p-av">{avatarEmoji}</div>
          <div className="p-badge">✅</div>
        </div>
        <div className="p-name">{profile?.fname} {profile?.lname}</div>
        <div className="p-id">ID : VP-DZ-{profile?.id?.slice(0,8)?.toUpperCase()}</div>
        <div className="p-chips">
          <span className="pchip">🩸 {profile?.blood || 'N/A'}</span>
          <span className="pchip">📍 {profile?.wilaya || 'N/A'}</span>
          <span className="pchip">{age} ans</span>
        </div>
      </div>
      <div style={{ height: 20 }} />
      <div className="sec-label">Informations personnelles</div>
      <div className="pinfo-list">
        {[['Prénom', profile?.fname],['Nom', profile?.lname],['Date de naissance', formatDate(profile?.dob)],['Genre', profile?.gender],['Wilaya', profile?.wilaya],['Groupe sanguin', profile?.blood],['N° CNAS', profile?.cnas],['Contact urgence', profile?.emergency]].map(([k,v], i) => (
          <div key={i} className="pinfo-row"><span className="pi-key">{k}</span><span className="pi-val">{v || '—'}</span></div>
        ))}
      </div>
      <div className="add-btn" onClick={() => { setForm(profile || {}); setModal(true) }}>✏️ Modifier mon profil</div>
      <div className="logout-btn" onClick={onLogout}>🚪 Se déconnecter</div>
      {modal && <Modal title="Modifier mon profil" onClose={() => setModal(false)}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" defaultValue={profile?.fname} onChange={e => setForm({ ...form, fname: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Nom</label><input className="form-input" defaultValue={profile?.lname} onChange={e => setForm({ ...form, lname: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Date de naissance</label><input className="form-input" type="date" defaultValue={profile?.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Groupe sanguin</label>
            <select className="form-select" defaultValue={profile?.blood} onChange={e => setForm({ ...form, blood: e.target.value })}>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Genre</label>
            <select className="form-select" defaultValue={profile?.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option>Masculin</option><option>Féminin</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Wilaya</label>
          <select className="form-select" defaultValue={profile?.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })}>
            {WILAYAS.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">N° CNAS</label><input className="form-input" defaultValue={profile?.cnas} onChange={e => setForm({ ...form, cnas: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Contact urgence</label><input className="form-input" defaultValue={profile?.emergency} onChange={e => setForm({ ...form, emergency: e.target.value })} /></div>
        <button className="btn-submit" onClick={save} disabled={saving}>{saving ? '⏳...' : 'Enregistrer'}</button>
        <button className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
      </Modal>}
    </div>
  )
}

function OnboardingScreen({ profile, setProfile, userId, showToast }) {
  const [form, setForm] = useState({ wilaya: 'Oran', blood: 'A+', gender: 'Masculin', dob: '', cnas: '', emergency: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.dob) { alert('Date de naissance requise'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', userId)
    if (!error) { setProfile({ ...profile, ...form }); showToast('✅ Profil complété !') }
    setSaving(false)
  }

  return (
    <div className="auth-screen" style={{ justifyContent: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
      <div className="auth-logo" style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--white)' }}>
          Complète ton <span style={{ color: 'var(--g)' }}>profil</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)' }}>Nécessaire pour ton dossier médical</div>
      </div>
      <div className="auth-card" style={{ width: '100%' }}>
        <div className="form-group"><label className="form-label">Date de naissance</label><input className="form-input" type="date" onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Groupe sanguin</label>
            <select className="form-select" onChange={e => setForm({ ...form, blood: e.target.value })}>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Genre</label>
            <select className="form-select" onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option>Masculin</option><option>Féminin</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Wilaya</label>
          <select className="form-select" onChange={e => setForm({ ...form, wilaya: e.target.value })}>
            {WILAYAS.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">N° CNAS</label><input className="form-input" placeholder="DZ-CNAS-XXXXXX" onChange={e => setForm({ ...form, cnas: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Contact d'urgence</label><input className="form-input" placeholder="+213 XXX XXX XXX" onChange={e => setForm({ ...form, emergency: e.target.value })} /></div>
        <button className="btn-submit" onClick={save} disabled={saving}>{saving ? '⏳...' : '✅ Accéder à VitaPass'}</button>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [screen, setScreen] = useState('home')
  const [navParams, setNavParams] = useState({})
  const [splash, setSplash] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => { const n = new Date(); setClock(`${n.getHours()}:${String(n.getMinutes()).padStart(2,'0')}`) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserData(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) { setSplash(true); loadUserData(session.user.id); setTimeout(() => setSplash(false), 2000) }
      else { setProfile(null); setDossier(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId) => {
    setLoading(true)
    const [{ data: prof }, { data: dos }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('dossiers').select('*').eq('patient_id', userId).maybeSingle()
    ])
    setProfile(prof)
    if (prof?.role === 'doctor') setScreen('doctor')
    setDossier(dos)
    setLoading(false)
  }

  const saveDossier = async (updates) => {
    if (!dossier) return
    const { data, error } = await supabase.from('dossiers').update({ ...updates, updated_at: new Date().toISOString() }).eq('patient_id', session.user.id).select().maybeSingle()
    if (!error && data) setDossier(data)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setScreen('home') }
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500) }
  const nav = (s, params = {}) => { setScreen(s); setNavParams(params) }

  const navItems = [
    { id: 'home', icon: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>, label: 'Accueil' },
    { id: 'qr', icon: <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2z"/>, label: 'QR Pass' },
    { id: 'dossier', icon: <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>, label: 'Dossier' },
    { id: 'doctors', icon: <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>, label: 'Médecins' },
    { id: 'profile', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>, label: 'Profil' },
  ]

  if (loading) return (
    <div className="phone" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading">⏳ Chargement...</div>
    </div>
  )

  const profileIncomplete = session && profile && !profile.blood && profile.role !== 'doctor'

  if (profileIncomplete) return (
    <div className="phone">
      <OnboardingScreen profile={profile} setProfile={setProfile} userId={session.user.id} showToast={showToast} />
    </div>
  )

  if (!session) return (
    <div className="phone">
      <AuthScreen onAuth={() => {}} />
    </div>
  )
  if (profile?.role === 'doctor') return (
    <>
      {screen === 'doctor' && <DoctorDashboard nav={nav} showToast={showToast} />}
      {screen === 'doctor-patient' && <PatientRecord nav={nav} showToast={showToast} patientId={navParams?.patientId} />}
      {screen === 'doctor-appointments' && <DoctorAppointments nav={nav} showToast={showToast} />}
      {toast && <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'rgba(13,21,38,.95)',border:'1px solid rgba(0,201,141,.3)',color:'#EFF3FF',padding:'10px 20px',borderRadius:20,zIndex:999,fontSize:13,fontWeight:600}}>{toast}</div>}
    </>
  )

  return (
    <div className="phone">
      {splash && (
        <div className="splash">
          <div className="sp-logo">
            <div className="sp-icon">
              <svg width="88" height="88" viewBox="0 0 110 110" fill="none">
                <circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5"/>
                <circle cx="55" cy="55" r="44" fill="#0A1628"/>
                <path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg)"/>
                <defs><linearGradient id="sg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#00C98D"/><stop offset="1" stopColor="#005E42"/></linearGradient></defs>
              </svg>
            </div>
            <div className="sp-name">Vita<span>Pass</span></div>
            <div className="sp-sub">Bienvenue {profile?.fname} !</div>
          </div>
          <div className="sp-bar"><div className="sp-fill" /></div>
        </div>
      )}
      <div className="sbar">
        <span className="sbar-time">{clock}</span>
        <div className="sbar-right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
        </div>
      </div>
      <div className="screens">
        {screen === 'home' && <HomeScreen nav={nav} profile={profile} dossier={dossier} />}
        {screen === 'qr' && <QRScreen nav={nav} profile={profile} dossier={dossier} />}
        {screen === 'dossier' && <DossierScreen nav={nav} dossier={dossier} onSave={saveDossier} showToast={showToast} />}
        {screen === 'suivi' && <SuiviScreen nav={nav} dossier={dossier} onSave={saveDossier} showToast={showToast} />}
        {screen === 'doctors' && <DoctorsScreen nav={nav} showToast={showToast} />}
        {screen === 'profile' && <ProfileScreen nav={nav} profile={profile} setProfile={setProfile} onLogout={handleLogout} showToast={showToast} />}
      </div>
      <div className="bnav">
        {navItems.map(item => (
          <div key={item.id} className={`ni${screen === item.id || (item.id === 'dossier' && screen === 'suivi') ? ' active' : ''}`} onClick={() => nav(item.id)}>
            <svg viewBox="0 0 24 24">{item.icon}</svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  )
}