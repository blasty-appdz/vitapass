import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { useTranslation } from 'react-i18next'
import { useOffline } from './hooks/useOffline'
import { useOfflineProfile, useOfflineDossier, useOfflineAppointments } from './hooks/useOfflineData'
import OfflineBanner from './components/OfflineBanner'
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientRecord from './pages/doctor/PatientRecord';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import ProfessionalOnboarding from './pages/doctor/ProfessionalOnboarding';
import ProfessionalSchedule from './pages/doctor/ProfessionalSchedule';
import ProfessionalDashboard from './pages/doctor/ProfessionalDashboard';
import SearchScreen from './pages/patient/SearchScreen';
import ProProfileScreen from './pages/patient/ProProfileScreen';
import BookingScreen from './pages/patient/BookingScreen';
import AppointmentsScreen from './pages/patient/AppointmentsScreen';
import EmergencyPublicPage from './pages/EmergencyPublicPage';

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
.doctor-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px}
.doctor-card-row{display:flex;align-items:center;gap:12px}
.doctor-av{width:44px;height:44px;border-radius:50%;background:rgba(77,159,236,.1);border:1px solid rgba(77,159,236,.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.doctor-info{flex:1}
.doctor-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--white)}
.doctor-spec{font-size:11px;color:var(--blue);margin-top:2px}
.doctor-email{font-size:11px;color:var(--dim);margin-top:2px}
.revoke-btn{background:rgba(255,90,90,.08);border:1px solid rgba(255,90,90,.2);border-radius:8px;padding:6px 10px;font-size:11px;font-family:'Syne',sans-serif;font-weight:700;color:#FF8A8A;cursor:pointer}
`

const styleEl = document.createElement('style')
styleEl.textContent = CSS
document.head.appendChild(styleEl)

const qrScript = document.createElement('script')
qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
document.head.appendChild(qrScript)

function ResetPasswordScreen() {
  const { t } = useTranslation()
  const [pwd, setPwd] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const handleReset = async () => {
    setLoading(true); setErr('')
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) { setErr(error.message); setLoading(false); return }
    window.history.replaceState(null, '', window.location.pathname)
    setDone(true); setLoading(false)
  }
  const base = { position:'fixed',inset:0,background:'#080E1E',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24 }
  const inputStyle = { width:'100%',maxWidth:340,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:12,padding:'13px 16px',color:'#EFF3FF',fontSize:14,outline:'none' }
  const btn = (d) => ({ width:'100%',maxWidth:340,background:d?'rgba(0,201,141,0.35)':'#00C98D',color:'#001A12',border:'none',borderRadius:12,padding:14,fontWeight:700,fontSize:14,cursor:d?'not-allowed':'pointer',fontFamily:"'Syne',sans-serif" })
  if (done) return (
    <div style={base}>
      <div style={{fontSize:56}}>✅</div>
      <div style={{color:'#EFF3FF',fontSize:22,fontWeight:800,fontFamily:"'Syne',sans-serif",textAlign:'center'}}>Mot de passe modifié !</div>
      <button onClick={() => window.location.href = window.location.origin + window.location.pathname} style={{...btn(false),marginTop:8}}>Se connecter →</button>
    </div>
  )
  return (
    <div style={base}>
      <div style={{fontSize:48}}>🔐</div>
      <div style={{color:'#EFF3FF',fontSize:22,fontWeight:800,fontFamily:"'Syne',sans-serif"}}>Nouveau mot de passe</div>
      <input type="password" placeholder="••••••••" value={pwd} onChange={e=>setPwd(e.target.value)} style={inputStyle} onKeyDown={e=>e.key==='Enter'&&pwd.length>=6&&handleReset()} />
      {err && <div style={{color:'#FF8A8A',fontSize:12,background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.2)',borderRadius:8,padding:'8px 14px',maxWidth:340,width:'100%',textAlign:'center'}}>⚠️ {err}</div>}
      <button onClick={handleReset} disabled={loading||pwd.length<6} style={btn(loading||pwd.length<6)}>{loading?'⏳...':'Valider'}</button>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
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
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  return (
    <div className="mini-chart">
      {data.map((v, i) => <div key={i} className={`bar${i===data.length-1?' hi':''}`} style={{height:`${20+((v-min)/range)*70}%`}} />)}
    </div>
  )
}

function AuthScreen({ onAuth }) {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [numeroOrdre, setNumeroOrdre] = useState('')

  const roles = [
    { id:'patient', icon:'🧑‍💼', label: t('auth.role_patient'), sub: t('auth.role_patient_sub') },
    { id:'doctor',  icon:'👨‍⚕️', label: t('auth.role_doctor'),  sub: t('auth.role_doctor_sub') },
  ]

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }
  const handleSignup = async () => {
    if (!fname||!lname||!email||!password) { setError(t('auth.all_fields_required')); return }
    if (password.length < 6) { setError(t('auth.password_min')); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ role, fname, lname, numero_ordre:numeroOrdre } } })
    if (error) setError(error.message)
    else setError('✅ ' + t('auth.account_created'))
    setLoading(false)
  }
  const handleForgotPassword = async () => {
    if (!email) { setError(t('auth.enter_email_first')); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo:'https://www.vitapass.app/auth/callback' })
    if (error) setError(error.message)
    else setError('✅ ' + t('auth.reset_sent'))
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div style={{position:'absolute',top:20,right:20}}>
        <button
          onClick={()=>{
            const next = i18n.language==='fr'?'ar':'fr'
            i18n.changeLanguage(next)
            localStorage.setItem('vitapass_lang',next)
          }}
          style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.15)',borderRadius:20,padding:'6px 16px',color:'#EFF3FF',fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}
        >
          🌐 {i18n.language==='fr'?'العربية':'Français'}
        </button>
      </div>
      <div className="auth-logo">
        <svg width="60" height="60" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5"/>
          <circle cx="55" cy="55" r="44" fill="#0A1628"/>
          <path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg)"/>
          <defs><linearGradient id="sg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#00C98D"/><stop offset="1" stopColor="#005E42"/></linearGradient></defs>
        </svg>
        <div className="auth-title">Vita<span>Pass</span></div>
        <div className="auth-sub">{t('tagline')}</div>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <div className={`auth-tab${tab==='login'?' active':''}`} onClick={()=>{setTab('login');setError('')}}>{t('auth.login')}</div>
          <div className={`auth-tab${tab==='signup'?' active':''}`} onClick={()=>{setTab('signup');setError('')}}>{t('auth.signup')}</div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {tab==='signup' && (
          <>
            <div className="sec-label" style={{margin:'0 0 8px'}}>{t('auth.i_am')}</div>
            <div className="role-select">
              {roles.map(r => (
                <div key={r.id} className={`role-btn${role===r.id?' selected':''}`} onClick={()=>setRole(r.id)}>
                  <span className="role-icon">{r.icon}</span>
                  <div><div className="role-label">{r.label}</div><div className="role-sub">{r.sub}</div></div>
                </div>
              ))}
            </div>
            {role==='doctor' && (
              <div className="form-group">
                <label className="form-label">{t('auth.ordre_number')}</label>
                <input className="form-input" placeholder="Ex: 12345" value={numeroOrdre} onChange={e=>setNumeroOrdre(e.target.value)} />
              </div>
            )}
            <div className="form-row">
              <div className="form-group"><label className="form-label">{t('auth.first_name')}</label><input className="form-input" placeholder="Karim" value={fname} onChange={e=>setFname(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">{t('auth.last_name')}</label><input className="form-input" placeholder="Bensalem" value={lname} onChange={e=>setLname(e.target.value)} /></div>
            </div>
          </>
        )}
        <div className="form-group"><label className="form-label">{t('auth.email')}</label><input className="form-input" type="email" placeholder="email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">{t('auth.password')}</label>
          <div className="pwd-wrap">
            <input className="form-input" type={showPwd?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={{paddingRight:40}} />
            <span className="pwd-eye" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁️'}</span>
          </div>
        </div>
        <button className="btn-submit" onClick={tab==='login'?handleLogin:handleSignup} disabled={loading}>
          {loading ? t('auth.loading') : tab==='login' ? '🔐 '+t('auth.login_btn') : '✨ '+t('auth.signup_btn')}
        </button>
        {tab==='login' && (
          <div style={{textAlign:'center',marginTop:12}}>
            <span onClick={handleForgotPassword} style={{color:'#00D4A0',fontSize:13,cursor:'pointer',textDecoration:'underline'}}>{t('auth.forgot_password')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function HomeScreen({ nav, profile, dossier, doctorCount=0, notifs=[], isOffline }) {
  const { t } = useTranslation()
  const meds = dossier?.meds || []
  return (
    <div className="screen" style={{display:'flex'}}>
      {isOffline && (
        <div style={{background:'rgba(255,209,102,.1)',border:'1px solid rgba(255,209,102,.25)',borderRadius:10,padding:'8px 14px',fontSize:12,color:'var(--yellow)',marginTop:8,display:'flex',alignItems:'center',gap:8}}>
          📴 <span>Mode hors ligne — données locales</span>
        </div>
      )}
      <div className="home-hdr">
        <div className="h-greet">{t('home.greeting')}</div>
        <div className="h-name">{profile?.fname} <span>{profile?.lname}</span></div>
      </div>
      <div className="vitacard" onClick={()=>nav('qr')}>
        <div className="vc-top">
          <span className="vc-logo">🏥 VitaPass</span>
          {profile?.blood && <span className="vc-blood">{profile.blood}</span>}
        </div>
        <div className="vc-name">{profile?.fname} {profile?.lname}</div>
        <div className="vc-info">{profile?.wilaya} · {profile?.cnas||'CNAS'}</div>
        <div className="vc-bottom">
          <span className="vc-id">VP-DZ-{profile?.id?.slice(0,8)?.toUpperCase()}</span>
          <span style={{fontSize:11,color:'rgba(0,201,141,.5)'}}>QR →</span>
        </div>
      </div>
      {notifs.map(n => (
        <div key={n.id} onClick={()=>nav(n.screen)} style={{background:'rgba(255,209,102,.08)',border:'1px solid rgba(255,209,102,.25)',borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:8,cursor:'pointer'}}>
          <span style={{fontSize:16}}>{n.icon}</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,.8)',flex:1,lineHeight:1.4}}>{n.txt}</span>
          <span style={{color:'#5A6A85',fontSize:16}}>›</span>
        </div>
      ))}
      <div className="sec-label">{t('home.health_summary')}</div>
      <div className="qstats">
        <div className="qs" onClick={()=>nav('dossier')}><div className="qs-icon">💊</div><div className="qs-val">{meds.length}</div><div className="qs-lbl">{t('home.treatments')}</div></div>
        <div className="qs" onClick={()=>nav('doctors')}><div className="qs-icon">👨‍⚕️</div><div className="qs-val">{doctorCount}</div><div className="qs-lbl">{t('home.doctors_count')}</div></div>
        <div className="qs" onClick={()=>nav('suivi')}><div className="qs-icon">📊</div><div className="qs-val">–</div><div className="qs-lbl">{t('home.metrics')}</div></div>
      </div>
      <div className="sec-label">{t('home.quick_access')}</div>
      <div className="action-list">
        <div className="action-row" onClick={()=>nav('qr')}><div className="ar-icon" style={{background:'rgba(255,90,90,.1)'}}>🆘</div><div className="ar-text"><div className="ar-title">{t('home.qr_pass_title')}</div><div className="ar-sub">{t('home.qr_pass_sub')}</div></div><span className="ar-arrow">›</span></div>
        <div className="action-row" onClick={()=>nav('search')}><div className="ar-icon" style={{background:'rgba(0,201,141,.1)'}}>📅</div><div className="ar-text"><div className="ar-title">{t('home.rdv_title')}</div><div className="ar-sub">{t('home.rdv_sub')}</div></div><span className="ar-arrow">›</span></div>
        <div className="action-row" onClick={()=>nav('dossier')}><div className="ar-icon" style={{background:'rgba(77,159,236,.1)'}}>📋</div><div className="ar-text"><div className="ar-title">{t('home.dossier_title')}</div><div className="ar-sub">{t('home.dossier_sub')}</div></div><span className="ar-arrow">›</span></div>
        <div className="action-row" onClick={()=>nav('doctors')}><div className="ar-icon" style={{background:'rgba(0,201,141,.1)'}}>👨‍⚕️</div><div className="ar-text"><div className="ar-title">{t('home.doctors_title')}</div><div className="ar-sub">{t('home.doctors_sub')}</div></div><span className="ar-arrow">›</span></div>
        <div className="action-row" onClick={()=>nav('suivi')}><div className="ar-icon" style={{background:'rgba(255,209,102,.1)'}}>❤️</div><div className="ar-text"><div className="ar-title">{t('home.suivi_title')}</div><div className="ar-sub">{t('home.suivi_sub')}</div></div><span className="ar-arrow">›</span></div>
      </div>
      <div className="pad-b" />
    </div>
  )
}

function QRScreen({ nav, profile, dossierData }) {
  const { t } = useTranslation()
  const qrRef = useRef(null)
  const qrInstance = useRef(null)

  useEffect(() => {
    if (!qrRef.current || !profile) return
    const qrText = dossierData?.urgence_token && dossierData?.urgence_public
      ? `https://vitapass.app/urgence/${dossierData.urgence_token}`
      : JSON.stringify({ id:profile.id, name:`${profile.fname} ${profile.lname}`, blood:profile.blood, emergency:profile.emergency })
    if (qrInstance.current) { qrInstance.current.clear(); qrInstance.current.makeCode(qrText) }
    else if (window.QRCode) { qrInstance.current = new window.QRCode(qrRef.current,{text:qrText,width:180,height:180,colorDark:'#000',colorLight:'#fff'}) }
  }, [profile, dossierData])

  const urgenceActive = dossierData?.urgence_public === true

  return (
    <div className="screen" style={{display:'flex'}}>
      <div className="screen-hdr"><div className="back-btn" onClick={()=>nav('home')}>←</div><div className="shdr-title">{t('nav.qr')}</div></div>
      <div className="qr-wrap">
        <div className="emergency-bar">
          <span style={{fontSize:20}}>🆘</span>
          <div className="emg-txt">{t('home.qr_pass_sub')}</div>
        </div>
        <div style={{background:'var(--card)',border:`1px solid ${urgenceActive?'rgba(0,201,141,.3)':'var(--border)'}`,borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:'var(--white)'}}>
              {urgenceActive ? '🟢 Accès urgence activé' : '🔴 Accès urgence désactivé'}
            </div>
            <div style={{fontSize:11,color:'var(--dim)',marginTop:3}}>
              {urgenceActive ? 'QR lisible sans connexion par les secouristes' : 'Activer pour rendre le QR accessible aux secouristes'}
            </div>
          </div>
          <UrgenceToggle dossier={dossierData} userId={profile?.id} />
        </div>
        <div className="qr-card">
          <div className="qr-tag">URGENCE MÉDICALE</div>
          <div className="qr-box" ref={qrRef} />
          <div className="qr-pname">{profile?.fname} {profile?.lname}</div>
          <div className="qr-pinfo">{profile?.wilaya} · {profile?.cnas}</div>
          <div className="qr-chips">
            {profile?.blood && <span className="badge badge-r">🩸 {profile.blood}</span>}
            {profile?.emergency && <span className="badge badge-g">📞 {profile.emergency}</span>}
            {urgenceActive && <span className="badge badge-g">✅ Public</span>}
          </div>
        </div>
      </div>
      <div className="pad-b" />
    </div>
  )
}

function UrgenceToggle({ dossier, userId }) {
  const [active, setActive] = useState(dossier?.urgence_public || false)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const newVal = !active
    const { error } = await supabase
      .from('dossiers')
      .update({ urgence_public: newVal })
      .eq('patient_id', userId)
    if (!error) setActive(newVal)
    setLoading(false)
  }

  return (
    <div
      onClick={loading ? undefined : toggle}
      style={{
        width:48, height:28, borderRadius:14,
        background: active ? 'var(--g)' : 'rgba(255,255,255,.1)',
        position:'relative', cursor: loading ? 'not-allowed' : 'pointer',
        transition:'background .25s', flexShrink:0,
        border: active ? '1px solid rgba(0,201,141,.4)' : '1px solid rgba(255,255,255,.15)'
      }}
    >
      <div style={{
        position:'absolute', top:3,
        left: active ? 22 : 3,
        width:20, height:20, borderRadius:'50%',
        background:'#fff', transition:'left .25s',
        boxShadow:'0 1px 4px rgba(0,0,0,.3)'
      }} />
    </div>
  )
}

function DossierScreen({ nav, dossier, onSave, showToast, isOffline }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('med')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [patientDocs, setPatientDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [docFile, setDocFile] = useState(null)
  const [docForm, setDocForm] = useState({title:'',type:'ordonnance',date:'',medecin:''})
  const [docError, setDocError] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docInputRef = useRef(null)
  const meds = dossier?.meds||[]
  const allergies = dossier?.allergies||[]
  const antecedents = dossier?.antecedents||[]
  const vaccins = dossier?.vaccins||[
    {id:1,name:'BCG',status:'done',date:'1990-01-01'},
    {id:2,name:'Covid-19',status:'done',date:'2021-06-15'},
    {id:3,name:'Grippe saisonnière',status:'pending',date:null},
  ]
  const DOC_TYPES = { ordonnance:{label:'Ordonnance',icon:'💊'}, analyse:{label:'Analyse',icon:'🧪'}, radio:{label:'Radiologie',icon:'🩻'}, compte_rendu:{label:'Compte rendu',icon:'📋'}, autre:{label:'Autre',icon:'📄'} }
  useEffect(()=>{if(activeTab==='docs')loadDocs()},[activeTab])
  const loadDocs = async () => {
    if (isOffline) return
    setDocsLoading(true)
    const {data:{user}} = await supabase.auth.getUser()
    const {data} = await supabase.from('documents').select('*').eq('patient_id',user.id).order('created_at',{ascending:false})
    setPatientDocs(data||[]); setDocsLoading(false)
  }
  const handleOpenDoc = (doc) => { if(doc.file_url) window.open(doc.file_url,'_blank') }
  const handleDeleteDoc = async (doc) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if(!confirm(t('common.delete')+'?')) return
    await supabase.from('documents').delete().eq('id',doc.id)
    loadDocs(); showToast(t('common.success'))
  }
  const handleUpload = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if(!docFile){setDocError(t('common.required'));return}
    if(!docForm.title){setDocError(t('common.required'));return}
    setUploadingDoc(true); setDocError('')
    const {data:{user}} = await supabase.auth.getUser()
    const ext = docFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const {error:upErr} = await supabase.storage.from('documents').upload(path,docFile)
    if(upErr){setDocError(upErr.message);setUploadingDoc(false);return}
    const {data:{publicUrl}} = supabase.storage.from('documents').getPublicUrl(path)
    await supabase.from('documents').insert({patient_id:user.id,title:docForm.title,type:docForm.type,date:docForm.date||null,medecin:docForm.medecin||null,file_url:publicUrl})
    setShowUploadModal(false); setDocFile(null); setDocForm({title:'',type:'ordonnance',date:'',medecin:''})
    loadDocs(); showToast('✅ '+t('common.success')); setUploadingDoc(false)
  }
  const addMed = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if(!form.name)return; setSaving(true); await onSave({meds:[...meds,{id:Date.now(),...form}]}); setModal(null);setForm({});setSaving(false);showToast('✅')
  }
  const addAllergy = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if(!form.name)return; setSaving(true); await onSave({allergies:[...allergies,{id:Date.now(),name:form.name}]}); setModal(null);setForm({});setSaving(false);showToast('✅')
  }
  const removeAllergy = async (id) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    await onSave({allergies:allergies.filter(a=>a.id!==id)})
  }
  const addAnt = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if(!form.name)return; setSaving(true); await onSave({antecedents:[...antecedents,{id:Date.now(),...form}]}); setModal(null);setForm({});setSaving(false);showToast('✅')
  }
  const addVacc = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if(!form.name)return; setSaving(true); await onSave({vaccins:[...vaccins,{id:Date.now(),...form}]}); setModal(null);setForm({});setSaving(false);showToast('✅')
  }

  const tabs = [
    {id:'med',label:'💊 '+t('dossier.meds')},
    {id:'allergy',label:'⚠️ '+t('dossier.allergies')},
    {id:'ant',label:'🩺 '+t('dossier.antecedents')},
    {id:'vacc',label:'💉 '+t('dossier.vaccins')},
    {id:'docs',label:'📄 '+t('dossier.docs')},
  ]
  return (
    <div className="screen" style={{display:'flex'}}>
      <div className="screen-hdr"><div className="back-btn" onClick={()=>nav('home')}>←</div><div className="shdr-title">{t('dossier.title')}</div></div>
      {isOffline && (
        <div style={{background:'rgba(255,209,102,.1)',border:'1px solid rgba(255,209,102,.25)',borderRadius:10,padding:'8px 14px',fontSize:12,color:'var(--yellow)',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
          📴 <span>Mode hors ligne — lecture seule</span>
        </div>
      )}
      <div className="tabs">{tabs.map(t2=><div key={t2.id} className={`tab${activeTab===t2.id?' active':''}`} onClick={()=>setActiveTab(t2.id)}>{t2.label}</div>)}</div>
      {activeTab==='med' && <>
        <div className="dsect-title">{t('dossier.meds')}</div>
        {meds.length===0?<div className="empty-state"><div className="empty-icon">💊</div><p>{t('dossier.no_meds')}</p></div>
          :meds.map(m=>(<div key={m.id} className="card"><div className="card-row"><div className="card-icon" style={{background:'rgba(77,159,236,.1)'}}>💊</div><div className="card-info"><div className="card-name">{m.name}</div><div className="card-sub">{m.dose}{m.reason?' · '+m.reason:''}</div></div><span className="badge badge-g">{t('dossier.active')}</span></div></div>))}
        {!isOffline && <div className="add-btn" onClick={()=>{setModal('med');setForm({})}}>＋ {t('dossier.add_med')}</div>}
        <div className="pad-b" />
      </>}
      {activeTab==='allergy' && <>
        <div className="dsect-title">{t('dossier.allergies')}</div>
        <div className="allergy-wrap">
          {allergies.length===0?<div className="empty-state"><div className="empty-icon">⚠️</div><p>{t('dossier.no_allergies')}</p></div>
            :allergies.map(a=>(<div key={a.id} className="achip">{a.name}{!isOffline&&<span className="achip-rm" onClick={()=>removeAllergy(a.id)}>✕</span>}</div>))}
        </div>
        {!isOffline && <div className="add-btn" onClick={()=>{setModal('allergy');setForm({})}}>＋ {t('dossier.add_allergy')}</div>}
        <div className="pad-b" />
      </>}
      {activeTab==='ant' && <>
        <div className="dsect-title">{t('dossier.antecedents')}</div>
        {antecedents.length===0?<div className="empty-state"><div className="empty-icon">📋</div><p>{t('dossier.no_antecedents')}</p></div>
          :antecedents.map(a=>(<div key={a.id} className="card"><div className="card-row"><div className="card-icon" style={{background:'rgba(255,209,102,.1)'}}>🩺</div><div className="card-info"><div className="card-name">{a.name}</div><div className="card-sub">{a.type}{a.year?' · '+a.year:''}</div></div><span className="badge badge-r">{a.type}</span></div></div>))}
        {!isOffline && <div className="add-btn" onClick={()=>{setModal('ant');setForm({type:t('dossier.chronic')})}}>＋ {t('dossier.add_antecedent')}</div>}
        <div className="pad-b" />
      </>}
      {activeTab==='vacc' && <>
        <div className="dsect-title">{t('dossier.vaccins')}</div>
        {vaccins.map(v=>(<div key={v.id} className="vacc-row"><div><div className="vacc-name">{v.name}</div><div className="vacc-date">{v.date?formatDate(v.date):'—'}</div></div><div className="vacc-ico" style={{background:v.status==='done'?'rgba(0,201,141,.15)':'rgba(255,209,102,.15)'}}>{v.status==='done'?'✅':'⏳'}</div></div>))}
        {!isOffline && <div className="add-btn" onClick={()=>{setModal('vacc');setForm({status:'done'})}}>＋ {t('dossier.add_vaccin')}</div>}
        <div className="pad-b" />
      </>}
      {activeTab==='docs' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <span style={{fontWeight:600,color:'var(--white)'}}>📄 {t('dossier.docs')} ({patientDocs.length})</span>
            {!isOffline && <div className="add-btn" style={{margin:0,padding:'6px 12px'}} onClick={()=>setShowUploadModal(true)}>+ {t('common.add')}</div>}
          </div>
          {docsLoading?<p style={{color:'var(--dim)'}}>{t('common.loading')}</p>:patientDocs.length===0?(
            <div style={{textAlign:'center',padding:32,color:'var(--dim)'}}><div style={{fontSize:40}}>📂</div><div>{isOffline ? 'Documents non disponibles hors ligne' : t('dossier.docs')}</div></div>
          ):patientDocs.map(doc=>(
            <div key={doc.id} className="doc-card">
              <div className="doc-top">
                <span style={{fontSize:20}}>{DOC_TYPES[doc.type]?.icon||'📄'}</span>
                <div style={{flex:1,marginLeft:8}}>
                  <div className="doc-name">{doc.title}</div>
                  <div className="doc-spec">{DOC_TYPES[doc.type]?.label} · {doc.date}</div>
                  {doc.medecin&&<div className="doc-loc">Dr. {doc.medecin}</div>}
                </div>
                <button className="doc-btn" style={{background:'rgba(77,159,236,.1)',color:'var(--blue)'}} onClick={()=>handleOpenDoc(doc)}>👁</button>
                {!isOffline && <button className="doc-btn" style={{marginLeft:4,background:'rgba(255,90,90,.1)',color:'#FF8A8A'}} onClick={()=>handleDeleteDoc(doc)}>🗑</button>}
              </div>
            </div>
          ))}
          {!isOffline && showUploadModal&&(
            <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowUploadModal(false)}>
              <div className="modal">
                <div className="modal-handle"/>
                <div className="modal-title">+ {t('common.add')}</div>
                <div className="form-group">
                  <label className="form-label">Fichier *</label>
                  <div onClick={()=>docInputRef.current.click()} style={{border:'2px dashed rgba(255,255,255,.15)',borderRadius:8,padding:16,textAlign:'center',cursor:'pointer'}}>
                    <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setDocFile(f);if(!docForm.title)setDocForm(p=>({...p,title:f.name.replace(/\.[^/.]+$/,'')}))}}} />
                    {docFile?<span style={{color:'var(--g)'}}>✅ {docFile.name}</span>:<span style={{color:'var(--dim)'}}>📂 Choisir un fichier</span>}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={docForm.title} onChange={e=>setDocForm(p=>({...p,title:e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={docForm.type} onChange={e=>setDocForm(p=>({...p,type:e.target.value}))}>{Object.entries(DOC_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={docForm.date} onChange={e=>setDocForm(p=>({...p,date:e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">Médecin</label><input className="form-input" value={docForm.medecin} onChange={e=>setDocForm(p=>({...p,medecin:e.target.value}))} /></div>
                {docError&&<div style={{color:'#FF8A8A',fontSize:13}}>⚠️ {docError}</div>}
                <button className="btn-submit" onClick={handleUpload} disabled={uploadingDoc}>{uploadingDoc?'⏳...':'⬆️ '+t('common.save')}</button>
              </div>
            </div>
          )}
        </div>
      )}
      {!isOffline && modal==='med'&&<Modal title={t('dossier.add_med')} onClose={()=>setModal(null)}>
        <div className="form-group"><label className="form-label">Nom</label><input className="form-input" placeholder="Metformine 850mg" onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Posologie</label><input className="form-input" placeholder="2x/jour" onChange={e=>setForm({...form,dose:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Indication</label><input className="form-input" placeholder="Diabète" onChange={e=>setForm({...form,reason:e.target.value})} /></div>
        </div>
        <button className="btn-submit" onClick={addMed} disabled={saving}>{saving?'⏳...':t('common.save')}</button>
        <button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button>
      </Modal>}
      {!isOffline && modal==='allergy'&&<Modal title={t('dossier.add_allergy')} onClose={()=>setModal(null)}>
        <div className="form-group"><label className="form-label">Allergie</label><input className="form-input" placeholder="Pénicilline" onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <button className="btn-submit" onClick={addAllergy} disabled={saving}>{saving?'⏳...':t('common.save')}</button>
        <button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button>
      </Modal>}
      {!isOffline && modal==='ant'&&<Modal title={t('dossier.add_antecedent')} onClose={()=>setModal(null)}>
        <div className="form-group"><label className="form-label">Condition</label><input className="form-input" placeholder="Diabète de type 2" onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Année</label><input className="form-input" type="number" placeholder="2018" onChange={e=>setForm({...form,year:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" onChange={e=>setForm({...form,type:e.target.value})}>{[t('dossier.chronic'),t('dossier.hospitalization'),t('dossier.surgery'),t('dossier.other')].map(o=><option key={o}>{o}</option>)}</select></div>
        </div>
        <button className="btn-submit" onClick={addAnt} disabled={saving}>{saving?'⏳...':t('common.save')}</button>
        <button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button>
      </Modal>}
      {!isOffline && modal==='vacc'&&<Modal title={t('dossier.add_vaccin')} onClose={()=>setModal(null)}>
        <div className="form-group"><label className="form-label">Vaccin</label><input className="form-input" placeholder="BCG, Covid-19..." onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" onChange={e=>setForm({...form,date:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Statut</label><select className="form-select" onChange={e=>setForm({...form,status:e.target.value})}><option value="done">✅ Fait</option><option value="pending">⏳ À faire</option></select></div>
        </div>
        <button className="btn-submit" onClick={addVacc} disabled={saving}>{saving?'⏳...':t('common.save')}</button>
        <button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button>
      </Modal>}
    </div>
  )
}

function SuiviScreen({ nav, dossier, onSave, showToast }) {
  const { t } = useTranslation()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const glyc = dossier?.glyc||[], bp = dossier?.bp||[], weight = dossier?.weight||[]
  const lastGlyc = glyc.length>0?glyc[glyc.length-1]:null
  const lastBp = bp.length>0?bp[bp.length-1]:null
  const lastW = weight.length>0?weight[weight.length-1]:null
  const today = new Date().toISOString().split('T')[0]
  const saveMetric = async () => {
    if(modal==='glyc'){const v=parseFloat(form.val);if(!v)return;await onSave({glyc:[...glyc,v].slice(-7)})}
    else if(modal==='bp'){const s=parseInt(form.s),d=parseInt(form.d);if(!s||!d)return;await onSave({bp:[...bp,{s,d}].slice(-7)})}
    else if(modal==='weight'){const v=parseFloat(form.val);if(!v)return;await onSave({weight:[...weight,v].slice(-7)})}
    setModal(null);setForm({});showToast('✅')
  }
  return (
    <div className="screen" style={{display:'flex'}}>
      <div className="screen-hdr"><div className="back-btn" onClick={()=>nav('home')}>←</div><div className="shdr-title">{t('home.suivi_title')}</div></div>
      <div className="metric-card" onClick={()=>{setModal('glyc');setForm({date:today})}}>
        <div className="mc-hdr"><div className="mc-left"><span style={{fontSize:22}}>🩸</span><div><div className="mc-title">Glycémie (HbA1c)</div><div className="mc-sub">+ {t('common.add')}</div></div></div><div><span className="mc-val">{lastGlyc??'--'}</span><span className="mc-unit"> %</span></div></div>
        <MiniChart data={glyc} />
        <div className={`mc-trend${lastGlyc&&lastGlyc>=7.5?' warn':''}`}>{lastGlyc?(lastGlyc<7.5?'↓ OK':'↗️ Élevé'):'+ '+t('common.add')}</div>
      </div>
      <div className="metric-card" onClick={()=>{setModal('bp');setForm({date:today})}}>
        <div className="mc-hdr"><div className="mc-left"><span style={{fontSize:22}}>❤️</span><div><div className="mc-title">Tension artérielle</div><div className="mc-sub">mmHg</div></div></div><div><span className="mc-val">{lastBp?lastBp.s:'--'}</span><span className="mc-unit">{lastBp?'/'+lastBp.d:''}</span></div></div>
        <MiniChart data={bp.map(b=>b.s)} />
        <div className={`mc-trend${lastBp&&lastBp.s>130?' warn':''}`}>{lastBp?(lastBp.s>130?'↗️ Élevé':'↓ Normal'):'+ '+t('common.add')}</div>
      </div>
      <div className="metric-card" onClick={()=>{setModal('weight');setForm({date:today})}}>
        <div className="mc-hdr"><div className="mc-left"><span style={{fontSize:22}}>⚖️</span><div><div className="mc-title">Poids</div><div className="mc-sub">kg</div></div></div><div><span className="mc-val">{lastW??'--'}</span><span className="mc-unit"> kg</span></div></div>
        <MiniChart data={weight} />
        <div className="mc-trend">{lastW&&weight.length>1?`${weight[0]>lastW?'↓':'↑'} ${Math.abs(weight[0]-lastW).toFixed(1)}kg`:'+ '+t('common.add')}</div>
      </div>
      <div className="pad-b" />
      {modal==='glyc'&&<Modal title="Glycémie" onClose={()=>setModal(null)}><div className="form-group"><label className="form-label">%</label><input className="form-input" type="number" step="0.1" placeholder="7.2" onChange={e=>setForm({...form,val:e.target.value})} /></div><button className="btn-submit" onClick={saveMetric}>{t('common.save')}</button><button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button></Modal>}
      {modal==='bp'&&<Modal title="Tension" onClose={()=>setModal(null)}><div className="form-row"><div className="form-group"><label className="form-label">Sys.</label><input className="form-input" type="number" placeholder="128" onChange={e=>setForm({...form,s:e.target.value})} /></div><div className="form-group"><label className="form-label">Dias.</label><input className="form-input" type="number" placeholder="82" onChange={e=>setForm({...form,d:e.target.value})} /></div></div><button className="btn-submit" onClick={saveMetric}>{t('common.save')}</button><button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button></Modal>}
      {modal==='weight'&&<Modal title="Poids" onClose={()=>setModal(null)}><div className="form-group"><label className="form-label">kg</label><input className="form-input" type="number" step="0.1" placeholder="82" onChange={e=>setForm({...form,val:e.target.value})} /></div><button className="btn-submit" onClick={saveMetric}>{t('common.save')}</button><button className="btn-cancel" onClick={()=>setModal(null)}>{t('common.cancel')}</button></Modal>}
    </div>
  )
}

function DoctorsScreen({ nav, showToast }) {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundDoctor, setFoundDoctor] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [adding, setAdding] = useState(false)
  useEffect(()=>{loadDoctors()},[])
  const loadDoctors = async () => {
    setLoading(true)
    const {data:{user}} = await supabase.auth.getUser()
    const {data:accesses} = await supabase.from('doctor_access').select('*').eq('patient_id',user.id).eq('status','active')
    if(!accesses||accesses.length===0){setDoctors([]);setLoading(false);return}
    const doctorProfiles = []
    for(const access of accesses){
      const {data:prof} = await supabase.from('profiles').select('id,fname,lname,gender,specialite,numero_ordre').eq('id',access.doctor_id).maybeSingle()
      if(prof) doctorProfiles.push({...prof,access_id:access.id,since:access.granted_at})
    }
    setDoctors(doctorProfiles); setLoading(false)
  }
  const searchDoctorReal = async () => {
    if(!email.trim()){setSearchError(t('common.required'));return}
    setSearching(true);setSearchError('');setFoundDoctor(null)
    const {data,error} = await supabase.rpc('find_doctor_by_email',{p_email:email.trim().toLowerCase()})
    if(error||!data||data.length===0){setSearchError('Aucun médecin trouvé');setSearching(false);return}
    const doc = data[0]
    if(doc.role!=='doctor'){setSearchError("Pas un médecin");setSearching(false);return}
    const {data:{user}} = await supabase.auth.getUser()
    const {data:existing} = await supabase.from('doctor_access').select('id').eq('patient_id',user.id).eq('doctor_id',doc.id).eq('status','active').maybeSingle()
    if(existing){setSearchError('Déjà autorisé');setSearching(false);return}
    setFoundDoctor(doc);setSearching(false)
  }
  const authorizeDoctor = async () => {
    if(!foundDoctor)return;setAdding(true)
    const {data:{user}} = await supabase.auth.getUser()
    const {error} = await supabase.from('doctor_access').insert({patient_id:user.id,doctor_id:foundDoctor.id,status:'active'})
    if(error){showToast('❌ '+error.message);setAdding(false);return}
    showToast('✅');setShowModal(false);setEmail('');setFoundDoctor(null);loadDoctors();setAdding(false)
  }
  const revokeDoctor = async (accessId,name) => {
    if(!confirm('Révoquer ?'))return
    await supabase.from('doctor_access').update({status:'revoked'}).eq('id',accessId)
    showToast('OK');loadDoctors()
  }
  return (
    <div className="screen" style={{display:'flex'}}>
      <div className="screen-hdr"><div className="back-btn" onClick={()=>nav('home')}>←</div><div className="shdr-title">{t('home.doctors_title')}</div></div>
      {loading?<div className="loading">{t('common.loading')}</div>
        :doctors.length===0?<div className="empty-state" style={{marginTop:24}}><div className="empty-icon">👨‍⚕️</div><p>{t('home.doctors_title')}</p></div>
        :doctors.map(doc=>(
          <div key={doc.id} className="doctor-card">
            <div className="doctor-card-row">
              <div className="doctor-av">{doc.gender==='Féminin'?'👩‍⚕️':'👨‍⚕️'}</div>
              <div className="doctor-info">
                <div className="doctor-name">Dr. {doc.fname} {doc.lname}</div>
                {doc.specialite&&<div className="doctor-spec">{doc.specialite}</div>}
                <div className="doctor-email">{formatDate(doc.since)}</div>
              </div>
              <div className="revoke-btn" onClick={()=>revokeDoctor(doc.access_id,`${doc.fname} ${doc.lname}`)}>Révoquer</div>
            </div>
          </div>
        ))}
      <div className="add-btn" onClick={()=>{setShowModal(true);setEmail('');setFoundDoctor(null);setSearchError('')}}>＋ {t('common.add')}</div>
      <div className="pad-b" />
      {showModal&&(
        <Modal title="Autoriser un médecin" onClose={()=>setShowModal(false)}>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={e=>{setEmail(e.target.value);setFoundDoctor(null);setSearchError('')}} /></div>
          {searchError&&<div className="error-msg">{searchError}</div>}
          {foundDoctor&&(
            <div style={{background:'rgba(0,201,141,.06)',border:'1px solid rgba(0,201,141,.2)',borderRadius:12,padding:14,marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:28}}>{foundDoctor.gender==='Féminin'?'👩‍⚕️':'👨‍⚕️'}</span>
              <div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:'var(--white)'}}>Dr. {foundDoctor.fname} {foundDoctor.lname}</div>{foundDoctor.specialite&&<div style={{fontSize:12,color:'var(--blue)',marginTop:2}}>{foundDoctor.specialite}</div>}</div>
            </div>
          )}
          {!foundDoctor
            ?<button className="btn-submit" onClick={searchDoctorReal} disabled={searching}>{searching?t('common.loading'):t('common.search')}</button>
            :<button className="btn-submit" onClick={authorizeDoctor} disabled={adding}>{adding?'⏳...':t('common.confirm')}</button>}
          <button className="btn-cancel" onClick={()=>setShowModal(false)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}

function ProfileScreen({ nav, profile, setProfile, onLogout, showToast, isOffline }) {
  const { t, i18n } = useTranslation()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(profile||{})
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    setSaving(true)
    const {error} = await supabase.from('profiles').update({fname:form.fname,lname:form.lname,dob:form.dob,gender:form.gender,wilaya:form.wilaya,blood:form.blood,cnas:form.cnas,emergency:form.emergency}).eq('id',profile.id)
    if(!error){setProfile({...profile,...form});setModal(false);showToast('✅')}
    setSaving(false)
  }
  const age = profile?.dob?new Date().getFullYear()-parseInt(profile.dob.split('-')[0]):''
  return (
    <div className="screen" style={{display:'flex'}}>
      <div className="profile-hero">
        <div className="p-av-wrap"><div className="p-av">{getAvatarEmoji(profile?.gender,'patient')}</div><div className="p-badge">✅</div></div>
        <div className="p-name">{profile?.fname} {profile?.lname}</div>
        <div className="p-id">VP-DZ-{profile?.id?.slice(0,8)?.toUpperCase()}</div>
        <div className="p-chips"><span className="pchip">🩸 {profile?.blood||'N/A'}</span><span className="pchip">📍 {profile?.wilaya||'N/A'}</span><span className="pchip">{age} ans</span></div>
      </div>
      {isOffline && (
        <div style={{background:'rgba(255,209,102,.1)',border:'1px solid rgba(255,209,102,.25)',borderRadius:10,padding:'8px 14px',fontSize:12,color:'var(--yellow)',margin:'8px 0',display:'flex',alignItems:'center',gap:8}}>
          📴 <span>Mode hors ligne — modification désactivée</span>
        </div>
      )}
      <div style={{height:16}} />
      <div className="sec-label">{t('profile.title')}</div>
      <div className="pinfo-list">
        {[[t('profile.first_name'),profile?.fname],[t('profile.last_name'),profile?.lname],[t('profile.dob'),formatDate(profile?.dob)],[t('profile.gender'),profile?.gender],[t('profile.wilaya'),profile?.wilaya],[t('profile.blood'),profile?.blood],[t('profile.cnas'),profile?.cnas],[t('profile.emergency'),profile?.emergency]].map(([k,v],i)=>(
          <div key={i} className="pinfo-row"><span className="pi-key">{k}</span><span className="pi-val">{v||'—'}</span></div>
        ))}
      </div>
      {!isOffline && <div className="add-btn" onClick={()=>{setForm(profile||{});setModal(true)}}>✏️ {t('profile.edit')}</div>}
      <div className="logout-btn" onClick={onLogout}>🚪 {t('profile.logout')}</div>
      {modal&&<Modal title={t('profile.edit')} onClose={()=>setModal(false)}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('profile.first_name')}</label><input className="form-input" defaultValue={profile?.fname} onChange={e=>setForm({...form,fname:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">{t('profile.last_name')}</label><input className="form-input" defaultValue={profile?.lname} onChange={e=>setForm({...form,lname:e.target.value})} /></div>
        </div>
        <div className="form-group"><label className="form-label">{t('profile.dob')}</label><input className="form-input" type="date" defaultValue={profile?.dob} onChange={e=>setForm({...form,dob:e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('profile.blood')}</label><select className="form-select" defaultValue={profile?.blood} onChange={e=>setForm({...form,blood:e.target.value})}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b}>{b}</option>)}</select></div>
          <div className="form-group"><label className="form-label">{t('profile.gender')}</label><select className="form-select" defaultValue={profile?.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option>{t('profile.male')}</option><option>{t('profile.female')}</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">{t('profile.wilaya')}</label><select className="form-select" defaultValue={profile?.wilaya} onChange={e=>setForm({...form,wilaya:e.target.value})}>{WILAYAS.map(w=><option key={w}>{w}</option>)}</select></div>
        <div className="form-group"><label className="form-label">{t('profile.cnas')}</label><input className="form-input" defaultValue={profile?.cnas} onChange={e=>setForm({...form,cnas:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">{t('profile.emergency')}</label><input className="form-input" defaultValue={profile?.emergency} onChange={e=>setForm({...form,emergency:e.target.value})} /></div>
        <button className="btn-submit" onClick={save} disabled={saving}>{saving?'⏳...':t('profile.save')}</button>
        <button className="btn-cancel" onClick={()=>setModal(false)}>{t('profile.cancel')}</button>
      </Modal>}
    </div>
  )
}

function OnboardingScreen({ profile, setProfile, userId, showToast }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({wilaya:'Oran',blood:'A+',gender:'Masculin',dob:'',cnas:'',emergency:''})
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if(!form.dob){alert(t('common.required'));return}
    setSaving(true)
    const {error} = await supabase.from('profiles').update(form).eq('id',userId)
    if(!error){setProfile({...profile,...form});showToast('✅')}
    setSaving(false)
  }
  return (
    <div className="auth-screen" style={{justifyContent:'flex-start',paddingTop:40,overflowY:'auto'}}>
      <div className="auth-logo" style={{marginBottom:8}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:'var(--white)'}}>Complète ton <span style={{color:'var(--g)'}}>profil</span></div>
      </div>
      <div className="auth-card" style={{width:'100%'}}>
        <div className="form-group"><label className="form-label">{t('profile.dob')}</label><input className="form-input" type="date" onChange={e=>setForm({...form,dob:e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('profile.blood')}</label><select className="form-select" onChange={e=>setForm({...form,blood:e.target.value})}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b}>{b}</option>)}</select></div>
          <div className="form-group"><label className="form-label">{t('profile.gender')}</label><select className="form-select" onChange={e=>setForm({...form,gender:e.target.value})}><option>{t('profile.male')}</option><option>{t('profile.female')}</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">{t('profile.wilaya')}</label><select className="form-select" onChange={e=>setForm({...form,wilaya:e.target.value})}>{WILAYAS.map(w=><option key={w}>{w}</option>)}</select></div>
        <div className="form-group"><label className="form-label">{t('profile.cnas')}</label><input className="form-input" placeholder="DZ-CNAS-XXXXXX" onChange={e=>setForm({...form,cnas:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">{t('profile.emergency')}</label><input className="form-input" placeholder="+213 XXX XXX XXX" onChange={e=>setForm({...form,emergency:e.target.value})} /></div>
        <button className="btn-submit" onClick={save} disabled={saving}>{saving?'⏳...':'✅ '+t('common.confirm')}</button>
      </div>
    </div>
  )
}

function LandingScreen() {
  const { t } = useTranslation()
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  if (showAuth) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,padding:24,overflowY:'auto'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
        <svg width="56" height="56" viewBox="0 0 110 110" fill="none"><circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5"/><circle cx="55" cy="55" r="44" fill="#0A1628"/><path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg2)"/><defs><linearGradient id="sg2" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#00C98D"/><stop offset="1" stopColor="#005E42"/></linearGradient></defs></svg>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:'var(--white)'}}>Vita<span style={{color:'var(--g)'}}>Pass</span></div>
      </div>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:20,padding:20,width:'100%'}}>
        <div style={{display:'flex',background:'var(--card2)',borderRadius:10,padding:3,marginBottom:16,gap:2}}>
          <div onClick={()=>setAuthTab('login')} style={{flex:1,textAlign:'center',padding:8,fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:authTab==='login'?'#001A12':'var(--dim)',background:authTab==='login'?'var(--g)':'transparent',borderRadius:8,cursor:'pointer'}}>{t('auth.login')}</div>
          <div onClick={()=>setAuthTab('signup')} style={{flex:1,textAlign:'center',padding:8,fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:authTab==='signup'?'#001A12':'var(--dim)',background:authTab==='signup'?'var(--g)':'transparent',borderRadius:8,cursor:'pointer'}}>{t('auth.signup')}</div>
        </div>
        <AuthScreen tab={authTab} />
      </div>
      <div onClick={()=>setShowAuth(false)} style={{fontSize:13,color:'var(--dim)',cursor:'pointer',textDecoration:'underline'}}>← {t('common.back')}</div>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--white)',fontFamily:"'Inter',sans-serif"}}>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(8,14,30,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <span style={{fontFamily:"'Syne',sans-serif",fontSize:19,fontWeight:800,color:'var(--white)'}}>Vita<span style={{color:'var(--g)'}}>Pass</span></span>
        <div style={{display:'flex',gap:12}}>
          <button onClick={()=>{setAuthTab('login');setShowAuth(true)}} style={{background:'transparent',color:'var(--white)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,padding:'9px 20px',fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:'pointer'}}>{t('auth.login')}</button>
          <button onClick={()=>{setAuthTab('signup');setShowAuth(true)}} style={{background:'var(--g)',color:'#001A12',border:'none',borderRadius:8,padding:'9px 20px',fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:'pointer'}}>{t('auth.signup_btn')}</button>
        </div>
      </nav>
      <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px'}}>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:'clamp(28px,5vw,56px)',fontWeight:800,lineHeight:1.1,maxWidth:'820px',marginBottom:24}}>
          {t('landing.hero_title')}<br/><span style={{color:'var(--g)'}}>{t('landing.hero_title_accent')}</span>
        </h1>
        <p style={{fontSize:17,color:'#8A9AB5',maxWidth:'520px',lineHeight:1.75,marginBottom:44}}>{t('landing.hero_sub')}</p>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
          <button onClick={()=>{setAuthTab('signup');setShowAuth(true)}} style={{background:'var(--g)',color:'#001A12',border:'none',borderRadius:10,padding:'16px 40px',fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,cursor:'pointer'}}>{t('landing.create_btn')}</button>
          <button onClick={()=>{setAuthTab('login');setShowAuth(true)}} style={{background:'transparent',color:'var(--white)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'16px 36px',fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:600,cursor:'pointer'}}>{t('landing.login_btn')}</button>
        </div>
      </div>
      <div style={{padding:'32px 24px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <span style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:'var(--white)'}}>Vita<span style={{color:'var(--g)'}}>Pass</span></span>
        <span style={{fontSize:12,color:'var(--dim)'}}>© 2026 VitaPass · {t('landing.footer_free')}</span>
      </div>
    </div>
  )
}

export default function App() {
  const { t } = useTranslation()
  const { isOffline } = useOffline()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [screen, setScreen] = useState('home')
  const [navParams, setNavParams] = useState({})
  const [splash, setSplash] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [clock, setClock] = useState('')
  const [doctorCount, setDoctorCount] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [emergencyToken, setEmergencyToken] = useState(null)
  const [isRecovery] = useState(()=>window.location.hash.includes('type=recovery'))
  const [userId, setUserId] = useState(null)

  // ── Hooks offline — actifs dès que userId connu ──────────
  const { profile: offlineProfile } = useOfflineProfile(userId)
  const { dossier: offlineDossier } = useOfflineDossier(userId)
  const { appointments: offlineAppointments } = useOfflineAppointments(userId)
  // ─────────────────────────────────────────────────────────

  useEffect(()=>{
    const tick=()=>{const n=new Date();setClock(`${n.getHours()}:${String(n.getMinutes()).padStart(2,'0')}`)}
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id)
  },[])

  useEffect(()=>{
    const path = window.location.pathname
    const urgenceMatch = path.match(/^\/urgence\/([a-f0-9-]{36})$/)
    if (urgenceMatch) {
      setEmergencyToken(urgenceMatch[1])
      setLoading(false)
      return
    }
    if(isRecovery){setLoading(false);return}
    supabase.auth.getSession().then(({data:{session}})=>{
      setSession(session)
      if(session){setUserId(session.user.id);loadUserData(session.user.id)}
      else setLoading(false)
    })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
      setSession(session)
      if(session){
        setUserId(session.user.id)
        setSplash(true)
        loadUserData(session.user.id)
        setTimeout(()=>setSplash(false),2000)
      }
      else{setProfile(null);setDossier(null);setUserId(null);setLoading(false)}
    })
    return()=>subscription.unsubscribe()
  },[isRecovery])

  // ── Fallback offline : utiliser données cachées si dispo ─
  useEffect(()=>{
    if(!isOffline || !userId) return
    if(!profile && offlineProfile) setProfile(offlineProfile)
    if(!dossier && offlineDossier) setDossier(offlineDossier)
  },[isOffline, userId, offlineProfile, offlineDossier])
  // ─────────────────────────────────────────────────────────

  const loadUserData = async(userId)=>{
    setLoading(true)
    const [{data:prof},{data:dos},{count:docCount}]=await Promise.all([
      supabase.from('profiles').select('*').eq('id',userId).maybeSingle(),
      supabase.from('dossiers').select('*').eq('patient_id',userId).maybeSingle(),
      supabase.from('doctor_access').select('*',{count:'exact',head:true}).eq('patient_id',userId).eq('status','active')
    ])
    setProfile(prof)
    if(prof?.role==='doctor'){
      const {data:proData} = await supabase.from('professionals').select('fname,specialite,wilaya').eq('id',userId).maybeSingle()
      const profilComplet = proData?.fname && proData?.specialite && proData?.wilaya
      setScreen(profilComplet ? 'pro-dashboard' : 'pro-onboarding')
    }
    setDossier(dos);setDoctorCount(docCount||0)
    if(prof?.role==='patient')buildNotifs(dos,docCount||0)
    setLoading(false)
  }

  const buildNotifs=(dos,docCount)=>{
    const alerts=[]
    const meds=dos?.meds||[]
    if(meds.length>0)alerts.push({id:'med',icon:'💊',txt:`${meds[0].name}`,screen:'dossier'})
    if((dos?.glyc||[]).length===0)alerts.push({id:'glyc0',icon:'📊',txt:t('home.suivi_sub'),screen:'suivi'})
    if(docCount>0)alerts.push({id:'doc',icon:'👨‍⚕️',txt:`${docCount} ${t('home.doctors_count')}`,screen:'doctors'})
    setNotifs(alerts.slice(0,3))
  }

  const saveDossier=async(updates)=>{
    if(isOffline){showToast('Impossible en mode hors ligne');return}
    if(!dossier)return
    const {data,error}=await supabase.from('dossiers').update({...updates,updated_at:new Date().toISOString()}).eq('patient_id',session.user.id).select().maybeSingle()
    if(!error&&data)setDossier(data)
  }

  const handleLogout=async()=>{await supabase.auth.signOut();setScreen('home')}
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500)}
  const nav=(s,params={})=>{setScreen(s);setNavParams(params)}

  const navItems=[
    {id:'home',    icon:<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>,                                                                                                     label:t('nav.home')},
    {id:'search',  icon:<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>, label:t('nav.search')},
    {id:'appointments',icon:<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>, label:t('nav.rdv')},
    {id:'dossier', icon:<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>,               label:t('nav.dossier')},
    {id:'profile', icon:<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>,               label:t('nav.profile')},
  ]

  if (emergencyToken) return <EmergencyPublicPage token={emergencyToken} />
  if(isRecovery) return <ResetPasswordScreen />
  if(loading) return <div className="phone" style={{alignItems:'center',justifyContent:'center'}}><div className="loading">{t('common.loading')}</div></div>

  const profileIncomplete=session&&profile&&!profile.blood&&profile.role!=='doctor'
  if(profileIncomplete) return <div className="phone"><OnboardingScreen profile={profile} setProfile={setProfile} userId={session.user.id} showToast={showToast} /></div>
  if(!session) return <LandingScreen />

  if(profile?.role==='doctor') return (
    <>
      <OfflineBanner />
      {screen==='pro-onboarding'    && <ProfessionalOnboarding nav={nav} />}
      {screen==='pro-dashboard'     && <ProfessionalDashboard nav={nav} showToast={showToast} />}
      {screen==='pro-schedule'      && <ProfessionalSchedule nav={nav} showToast={showToast} />}
      {screen==='doctor'            && <DoctorDashboard nav={nav} showToast={showToast}/>}
      {screen==='doctor-patient'    && <PatientRecord nav={nav} showToast={showToast} patientId={navParams?.patientId}/>}
      {screen==='doctor-appointments'&&<DoctorAppointments nav={nav} showToast={showToast}/>}
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'rgba(13,21,38,.95)',border:'1px solid rgba(0,201,141,.3)',color:'#EFF3FF',padding:'10px 20px',borderRadius:20,zIndex:999,fontSize:13,fontWeight:600}}>{toast}</div>}
    </>
  )

  return (
    <div className="phone">
      <OfflineBanner />
      {splash&&(
        <div className="splash">
          <div className="sp-logo">
            <div className="sp-icon">
              <svg width="88" height="88" viewBox="0 0 110 110" fill="none"><circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5"/><circle cx="55" cy="55" r="44" fill="#0A1628"/><path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg)"/><defs><linearGradient id="sg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#00C98D"/><stop offset="1" stopColor="#005E42"/></linearGradient></defs></svg>
            </div>
            <div className="sp-name">Vita<span>Pass</span></div>
            <div className="sp-sub">Bienvenue {profile?.fname} !</div>
          </div>
          <div className="sp-bar"><div className="sp-fill"/></div>
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
        {screen==='home'         &&<HomeScreen nav={nav} profile={profile} dossier={dossier} doctorCount={doctorCount} notifs={notifs} isOffline={isOffline}/>}
        {screen==='qr'           &&<QRScreen nav={nav} profile={profile} dossierData={dossier}/>}
        {screen==='search'       &&<SearchScreen nav={nav}/>}
        {screen==='pro-profile'  &&<ProProfileScreen nav={nav} navParams={navParams}/>}
        {screen==='booking'      &&<BookingScreen nav={nav} navParams={navParams} showToast={showToast}/>}
        {screen==='appointments' &&<AppointmentsScreen nav={nav} showToast={showToast} user={session?.user} offlineAppointments={offlineAppointments} isOffline={isOffline}/>}
        {screen==='dossier'      &&<DossierScreen nav={nav} dossier={dossier} onSave={saveDossier} showToast={showToast} isOffline={isOffline}/>}
        {screen==='suivi'        &&<SuiviScreen nav={nav} dossier={dossier} onSave={saveDossier} showToast={showToast}/>}
        {screen==='doctors'      &&<DoctorsScreen nav={nav} showToast={showToast}/>}
        {screen==='profile'      &&<ProfileScreen nav={nav} profile={profile} setProfile={setProfile} onLogout={handleLogout} showToast={showToast} isOffline={isOffline}/>}
      </div>
      <div className="bnav">
        {navItems.map(item=>(
          <div key={item.id} className={`ni${screen===item.id||(item.id==='dossier'&&screen==='suivi')||(item.id==='search'&&(screen==='pro-profile'||screen==='booking'))?' active':''}`} onClick={()=>nav(item.id)}>
            <svg viewBox="0 0 24 24">{item.icon}</svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {toast&&<Toast msg={toast}/>}
    </div>
  )
}