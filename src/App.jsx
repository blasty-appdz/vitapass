import { useState, useEffect, useRef } from 'react'

// ── DATA & UTILS ──
const LS = {
  get: k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
}

const WILAYAS = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane']

const DEFAULTS = {
  profile: { fname: 'Karim', lname: 'Bensalem', dob: '1985-03-15', gender: 'Masculin', wilaya: 'Oran', blood: 'A+', cnas: 'DZ-CNAS-158742', emergency: '+213 555 123 456' },
  meds: [
    { id: 1, name: 'Metformine 850mg', dose: '2x/jour', reason: 'Diabète T2', doc: 'Dr. Meziane' },
    { id: 2, name: 'Amlodipine 5mg', dose: '1x/jour', reason: 'HTA', doc: 'Dr. Benali' },
  ],
  allergies: ['Pénicilline', 'Aspirine'],
  antecedents: [
    { id: 1, name: 'Diabète de type 2', year: '2018', type: 'Chronique' },
    { id: 2, name: 'Hypertension artérielle', year: '2020', type: 'Chronique' },
    { id: 3, name: 'Appendicectomie', year: '2010', type: 'Chirurgie' },
  ],
  vaccins: [
    { id: 1, name: 'BCG', date: '1985-06-01', status: 'done' },
    { id: 2, name: 'Covid-19 (Sinovac)', date: '2021-09-15', status: 'done' },
    { id: 3, name: 'Rappel DTP', date: '', status: 'pending' },
  ],
  docs: [
    { id: 1, title: 'Bilan glycémique', date: '2024-11-10', type: 'Analyse', result: 'HbA1c: 7.2%' },
    { id: 2, title: 'Radio thorax', date: '2024-09-05', type: 'Radio / IRM', result: 'Normal' },
  ],
  doctors: [
    { id: 1, name: 'Dr. Meziane Fatima', spec: 'Endocrinologue', wilaya: 'Oran', access: 'full' },
    { id: 2, name: 'Dr. Benali Hocine', spec: 'Cardiologue', wilaya: 'Oran', access: 'limited' },
  ],
  rdvs: [
    { id: 1, title: 'Consultation endocrino', date: '2025-02-18', time: '10:30', detail: 'Dr. Meziane · Oran' },
  ],
  glyc: [7.8, 7.5, 7.6, 7.3, 7.4, 7.2, 7.1],
  bp: [{s:138,d:88},{s:135,d:85},{s:132,d:84},{s:130,d:82},{s:128,d:80},{s:126,d:82},{s:128,d:81}],
  weight: [87, 86.5, 86, 85.8, 85.5, 85.2, 85],
  family: [
    { name: 'Nadia', age: '38', rel: 'Conjoint(e)' },
    { name: 'Lina', age: '8', rel: 'Enfant' },
  ],
}

const formatDate = d => {
  if (!d) return ''
  try { return new Intl.DateTimeFormat('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)) }
  catch { return d }
}

// ── TRANSLATIONS ──
const T = {
  fr: {
    greet: 'Bonjour 👋', langBtn: 'عربي',
    noBorn: 'Né le',
    'nav-home': 'Accueil', 'nav-qr': 'QR Pass', 'nav-dossier': 'Dossier', 'nav-doctors': 'Médecins', 'nav-profile': 'Profil',
    summaryLabel: 'Mon résumé santé', quickActions: 'Accès rapide',
    treatments: 'Traitements', doctors: 'Médecins', metrics: 'Métriques',
    alertPrefix: 'Rappel :', alertSuffix: 'dans 5 jours',
    actQr: 'Mon QR Pass', actQrSub: 'Partager mes infos en urgence',
    actDossier: 'Mon dossier', actDossierSub: 'Médicaments, antécédents…',
    actDoctors: 'Mes médecins', actDoctorsSub: 'Accès & rendez-vous',
    actSuivi: 'Mon suivi', actSuiviSub: 'Glycémie, tension, poids',
    qrTitle: 'Mon QR Pass', emergencyTxt: 'En cas d\'urgence, scannez ce QR pour accéder aux informations vitales',
    qrTag: 'URGENCE MÉDICALE', shareBtn: 'Partager', printBtn: 'Imprimer', nfcBtn: 'NFC', securityBtn: 'Sécurité',
    nfcTitle: 'Partage NFC disponible', nfcSub: 'Approchez un téléphone pour partager',
    scansLabel: 'Historique des scans', scan1: 'Dr. Meziane · Urgences Oran', scan1t: 'Il y a 2j', scan2: 'Pharmacie Centrale', scan2t: 'Il y a 1sem', scan3: 'Clinique El Amel', scan3t: 'Il y a 3sem',
    dossierTitle: 'Mon Dossier Médical',
    tabMeds: '💊 Traitement', tabAnt: '📋 Antécédents', tabVacc: '💉 Vaccins', tabDocs: '📄 Documents',
    enCours: 'Traitements en cours', allergiesLabel: 'Allergies connues',
    noMeds: 'Aucun traitement enregistré', noAnt: 'Aucun antécédent enregistré',
    chroniques: 'Antécédents médicaux', vaccinsLabel: 'Carnet vaccinal', docsLabel: 'Documents médicaux',
    noDocs: 'Aucun document ajouté',
    actif: 'Actif',
    addMed: 'Ajouter un médicament', addAllergy: 'Ajouter une allergie', addAnt: 'Ajouter un antécédent',
    addVacc: 'Ajouter un vaccin', addDoc: 'Ajouter un document',
    saved: '✅ Enregistré', deleted: '🗑 Supprimé', annuler: 'Annuler', copied: '📋 Copié !',
    doctorsTitle: 'Médecins & Rendez-vous',
    authorized: 'Médecins autorisés', addDoctor: 'Autoriser un médecin',
    accessFull: '✅ Accès complet', accessLimited: '⚠️ Accès partiel', revoke: 'Révoquer',
    rdvLabel: 'Mes rendez-vous', addRdv: 'Ajouter un rendez-vous', noRdv: 'Aucun rendez-vous',
    noDoctors: 'Aucun médecin autorisé',
    urgencesLabel: 'Numéros d\'urgence', pompiers: 'Pompiers',
    findHosp: '🏥 Trouver un hôpital ou EPSP à proximité', wilayasCovered: '48 wilayas couvertes',
    suiviTitle: 'Mon Suivi Santé', metricsLabel: 'Métriques médicales',
    glycTitle: 'Glycémie (HbA1c)', glycSub: 'Appuyer pour ajouter',
    bpTitle: 'Tension artérielle', bpSub: 'mmHg · Appuyer pour ajouter',
    weightTitle: 'Poids corporel', weightSub: 'kg · Appuyer pour ajouter',
    familyLabel: 'Suivi famille', addFam: 'Ajouter', ans: 'ans',
    remindersLabel: 'Rappels médicaments', noReminders: 'Ajoutez des médicaments pour activer les rappels',
    personalInfo: 'Informations personnelles',
    fnameLabel: 'Prénom', lnameLabel: 'Nom', dobLabel: 'Date de naissance',
    genderLabel: 'Genre', wilayaLabel: 'Wilaya', bloodLabel: 'Groupe sanguin',
    cnasLabel: 'N° CNAS / Sécurité sociale', emergencyLabel: 'Contact d\'urgence',
    editProfile: 'Modifier mon profil',
    settingsLabel: 'Paramètres',
    sSecurity: 'Sécurité & Confidentialité', sNotifs: 'Notifications', sLang: 'Langue · عربي',
    sJournal: 'Journal de modifications', sBackup: 'Sauvegarde & Restauration', sAbout: 'À propos de VitaPass',
    logout: '🚪 Se déconnecter',
  },
  ar: {
    greet: 'مرحباً 👋', langBtn: 'FR',
    noBorn: 'تاريخ الميلاد',
    'nav-home': 'الرئيسية', 'nav-qr': 'QR باس', 'nav-dossier': 'ملفي', 'nav-doctors': 'الأطباء', 'nav-profile': 'حسابي',
    summaryLabel: 'ملخص صحتي', quickActions: 'وصول سريع',
    treatments: 'العلاجات', doctors: 'الأطباء', metrics: 'المقاييس',
    alertPrefix: 'تذكير :', alertSuffix: 'خلال 5 أيام',
    actQr: 'بطاقتي QR', actQrSub: 'مشاركة المعلومات في حالات الطوارئ',
    actDossier: 'ملفي الطبي', actDossierSub: 'الأدوية والسوابق...',
    actDoctors: 'أطبائي', actDoctorsSub: 'الوصول والمواعيد',
    actSuivi: 'متابعتي', actSuiviSub: 'السكر، الضغط، الوزن',
    qrTitle: 'بطاقتي QR', emergencyTxt: 'في حالة طوارئ، امسح هذا الرمز للوصول إلى المعلومات الحيوية',
    qrTag: 'طوارئ طبية', shareBtn: 'مشاركة', printBtn: 'طباعة', nfcBtn: 'NFC', securityBtn: 'الأمان',
    nfcTitle: 'المشاركة عبر NFC متاحة', nfcSub: 'أقرّب هاتفاً للمشاركة',
    scansLabel: 'سجل المسح', scan1: 'د. مزيان · طوارئ وهران', scan1t: 'منذ يومين', scan2: 'الصيدلية المركزية', scan2t: 'منذ أسبوع', scan3: 'عيادة الأمل', scan3t: 'منذ 3 أسابيع',
    dossierTitle: 'ملفي الطبي',
    tabMeds: '💊 العلاج', tabAnt: '📋 السوابق', tabVacc: '💉 التطعيم', tabDocs: '📄 الوثائق',
    enCours: 'العلاجات الجارية', allergiesLabel: 'الحساسيات المعروفة',
    noMeds: 'لا توجد علاجات مسجلة', noAnt: 'لا توجد سوابق مسجلة',
    chroniques: 'السوابق الطبية', vaccinsLabel: 'دفتر التطعيم', docsLabel: 'الوثائق الطبية',
    noDocs: 'لم يتم إضافة أي وثيقة',
    actif: 'نشط',
    addMed: 'إضافة دواء', addAllergy: 'إضافة حساسية', addAnt: 'إضافة سابقة',
    addVacc: 'إضافة تطعيم', addDoc: 'إضافة وثيقة',
    saved: '✅ تم الحفظ', deleted: '🗑 تم الحذف', annuler: 'إلغاء', copied: '📋 تم النسخ!',
    doctorsTitle: 'الأطباء والمواعيد',
    authorized: 'الأطباء المصرح لهم', addDoctor: 'تصريح طبيب',
    accessFull: '✅ وصول كامل', accessLimited: '⚠️ وصول جزئي', revoke: 'سحب الصلاحية',
    rdvLabel: 'مواعيدي', addRdv: 'إضافة موعد', noRdv: 'لا توجد مواعيد',
    noDoctors: 'لا يوجد طبيب مصرح له',
    urgencesLabel: 'أرقام الطوارئ', pompiers: 'الإسعاد',
    findHosp: '🏥 ابحث عن مستشفى أو عيادة قريبة', wilayasCovered: '48 ولاية مشمولة',
    suiviTitle: 'متابعتي الصحية', metricsLabel: 'المقاييس الطبية',
    glycTitle: 'سكر الدم (HbA1c)', glycSub: 'اضغط لإضافة قياس',
    bpTitle: 'ضغط الدم', bpSub: 'mmHg · اضغط للإضافة',
    weightTitle: 'الوزن', weightSub: 'كغ · اضغط للإضافة',
    familyLabel: 'متابعة العائلة', addFam: 'إضافة', ans: 'سنة',
    remindersLabel: 'تذكيرات الأدوية', noReminders: 'أضف أدوية لتفعيل التذكيرات',
    personalInfo: 'المعلومات الشخصية',
    fnameLabel: 'الاسم', lnameLabel: 'اللقب', dobLabel: 'تاريخ الميلاد',
    genderLabel: 'الجنس', wilayaLabel: 'الولاية', bloodLabel: 'فصيلة الدم',
    cnasLabel: 'رقم CNAS', emergencyLabel: 'جهة اتصال الطوارئ',
    editProfile: 'تعديل ملفي',
    settingsLabel: 'الإعدادات',
    sSecurity: 'الأمان والخصوصية', sNotifs: 'الإشعارات', sLang: 'اللغة · FR',
    sJournal: 'سجل التعديلات', sBackup: 'النسخ الاحتياطي', sAbout: 'حول VitaPass',
    logout: '🚪 تسجيل الخروج',
  }
}

// ── MINI CHART ──
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

// ── MODAL ──
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

// ── TOAST ──
function Toast({ msg }) {
  return <div className="toast">{msg}</div>
}

// ── CSS ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
:root{--bg:#080E1E;--card:#0D1526;--card2:#111C2E;--g:#00C98D;--blue:#4D9FEC;--yellow:#FFD166;--red:#FF5A5A;--white:#EFF3FF;--dim:#5A6A85;--border:rgba(255,255,255,.07)}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{font-family:'Inter',sans-serif;background:#1a1a2e}
.phone{width:390px;height:844px;background:var(--bg);border-radius:44px;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08);margin:auto}
.sbar{height:44px;background:var(--bg);display:flex;align-items:center;justify-content:space-between;padding:0 20px;flex-shrink:0;position:relative;z-index:10}
.sbar-time{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--white)}
.sbar-right{display:flex;align-items:center;gap:10px}
.lang-toggle{background:rgba(0,201,141,.15);color:var(--g);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;padding:3px 9px;border-radius:20px;cursor:pointer;border:1px solid rgba(0,201,141,.25)}
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
/* SPLASH */
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
/* HOME */
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
/* QR */
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
.nfc-row{background:linear-gradient(135deg,rgba(77,159,236,.15),rgba(0,201,141,.1));border:1px solid rgba(77,159,236,.2);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px}
.scan-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.sl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.sl-txt{font-size:13px;color:var(--white);flex:1}
.sl-time{font-size:11px;color:var(--dim)}
/* BADGES */
.badge{font-size:10px;font-family:'Syne',sans-serif;font-weight:700;padding:3px 8px;border-radius:20px}
.badge-g{background:rgba(0,201,141,.12);color:var(--g);border:1px solid rgba(0,201,141,.2)}
.badge-r{background:rgba(255,90,90,.12);color:#FF8A8A;border:1px solid rgba(255,90,90,.2)}
.badge-y{background:rgba(255,209,102,.12);color:var(--yellow);border:1px solid rgba(255,209,102,.2)}
/* DOSSIER */
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
.vacc-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)}
.vacc-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--white)}
.vacc-date{font-size:11px;color:var(--dim);margin-top:3px}
.vacc-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px}
.add-btn{background:rgba(0,201,141,.08);border:1px dashed rgba(0,201,141,.3);border-radius:12px;padding:12px;text-align:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--g);cursor:pointer;margin:8px 0;transition:all .2s}
.add-btn:active{background:rgba(0,201,141,.15)}
.empty-state{text-align:center;padding:30px 20px;color:var(--dim)}
.empty-icon{font-size:36px;margin-bottom:10px}
/* DOCTORS */
.doc-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px}
.doc-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
.doc-avatar{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.doc-name{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--white)}
.doc-spec{font-size:12px;color:var(--blue);margin-top:2px}
.doc-loc{font-size:11px;color:var(--dim);margin-top:3px}
.doc-btns{display:flex;gap:8px}
.doc-btn{flex:1;padding:9px;border-radius:10px;text-align:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer}
.doc-btn-full{background:rgba(0,201,141,.1);color:var(--g);border:1px solid rgba(0,201,141,.2)}
.doc-btn-rev{background:rgba(255,90,90,.08);color:#FF8A8A;border:1px solid rgba(255,90,90,.2)}
.rdv-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px}
.rdv-date{width:44px;height:44px;background:rgba(77,159,236,.1);border:1px solid rgba(77,159,236,.2);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
.rdv-day{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--blue);line-height:1}
.rdv-month{font-size:9px;font-family:'Syne',sans-serif;font-weight:700;color:var(--dim);text-transform:uppercase}
.rdv-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--white)}
.rdv-detail{font-size:11px;color:var(--dim);margin-top:3px}
.divider{height:1px;background:var(--border);margin:14px 0}
.urg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.urg-btn{background:rgba(255,90,90,.07);border:1px solid rgba(255,90,90,.15);border-radius:14px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.urg-num{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#FF8A8A}
.urg-lbl{font-size:11px;color:var(--dim);font-family:'Syne',sans-serif;font-weight:600}
.hosp-btn{background:rgba(77,159,236,.07);border:1px solid rgba(77,159,236,.15);border-radius:14px;padding:14px 16px;cursor:pointer}
/* SUIVI */
.metric-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px;cursor:pointer}
.mc-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.mc-left{display:flex;align-items:center;gap:10px}
.mc-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--white)}
.mc-sub{font-size:11px;color:var(--dim);margin-top:2px}
.mc-val{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--g)}
.mc-unit{font-size:12px;color:var(--dim)}
.mini-chart{display:flex;align-items:flex-end;gap:3px;height:50px;margin-bottom:8px}
.bar{flex:1;background:rgba(0,201,141,.2);border-radius:3px 3px 0 0;transition:height .3s}
.bar.hi{background:var(--g)}
.mc-trend{font-size:11px;color:var(--g);font-family:'Syne',sans-serif;font-weight:600}
.mc-trend.warn{color:var(--yellow)}
.family-row{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
.family-row::-webkit-scrollbar{display:none}
.fam-card{flex-shrink:0;width:80px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 8px;text-align:center}
.fam-av{font-size:24px;margin-bottom:6px}
.fam-name{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--white)}
.fam-age{font-size:10px;color:var(--dim);margin-top:2px}
.fam-add{flex-shrink:0;width:80px;background:rgba(0,201,141,.05);border:1px dashed rgba(0,201,141,.3);border-radius:14px;padding:12px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-size:22px;color:var(--g)}
.reminder-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.toggle{width:40px;height:22px;background:var(--g);border-radius:11px;position:relative;cursor:pointer}
.toggle-knob{width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;right:2px;transition:transform .2s}
/* PROFILE */
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
.settings-list{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:10px}
.si{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);cursor:pointer}
.si:last-child{border-bottom:none}
.si-icon{font-size:18px;width:24px;text-align:center}
.si-text{flex:1;font-size:14px;color:var(--white)}
.si-arrow{color:var(--dim);font-size:18px}
.logout-btn{background:rgba(255,90,90,.08);border:1px solid rgba(255,90,90,.2);border-radius:14px;padding:14px;text-align:center;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#FF8A8A;cursor:pointer;margin-bottom:24px}
/* MODAL */
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
/* TOAST */
.toast{position:absolute;top:60px;left:50%;transform:translateX(-50%);background:rgba(13,21,38,.95);border:1px solid rgba(0,201,141,.3);color:var(--white);font-family:'Syne',sans-serif;font-size:13px;font-weight:600;padding:10px 20px;border-radius:20px;z-index:200;white-space:nowrap;backdrop-filter:blur(8px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
/* RTL */
[dir="rtl"] .ar-arrow{transform:scaleX(-1)}
[dir="rtl"] .back-btn{transform:scaleX(-1)}
[dir="rtl"] .modal{direction:rtl}
`

// Inject CSS
const styleEl = document.createElement('style')
styleEl.textContent = CSS
document.head.appendChild(styleEl)

// Load QR library
const qrScript = document.createElement('script')
qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
document.head.appendChild(qrScript)

// ══════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════

function HomeScreen({ lang, nav, profile, meds, doctors }) {
  const t = T[lang]
  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="home-hdr">
        <div className="h-greet">{t.greet}</div>
        <div className="h-name">{profile.fname} <span>{profile.lname}</span></div>
      </div>
      <div className="vitacard" onClick={() => nav('qr')}>
        <div className="vc-top">
          <div className="vc-logo">💚 VitaPass</div>
          <div className="vc-blood">{profile.blood}</div>
        </div>
        <div className="vc-name">{profile.fname} {profile.lname}</div>
        <div className="vc-info">{t.noBorn} {formatDate(profile.dob)} · {profile.wilaya}</div>
        <div className="vc-bottom">
          <div className="vc-id">VP-DZ-0042</div>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="2" fill="rgba(255,255,255,.65)"/>
            <rect x="5" y="5" width="10" height="10" rx="1" fill="rgba(0,80,40,.5)"/>
            <rect x="26" y="2" width="16" height="16" rx="2" fill="rgba(255,255,255,.65)"/>
            <rect x="29" y="5" width="10" height="10" rx="1" fill="rgba(0,80,40,.5)"/>
            <rect x="2" y="26" width="16" height="16" rx="2" fill="rgba(255,255,255,.65)"/>
            <rect x="5" y="29" width="10" height="10" rx="1" fill="rgba(0,80,40,.5)"/>
            <rect x="20" y="20" width="4" height="4" fill="rgba(255,255,255,.55)"/>
            <rect x="26" y="26" width="4" height="4" fill="rgba(255,255,255,.55)"/>
            <rect x="34" y="26" width="4" height="4" fill="rgba(255,255,255,.55)"/>
          </svg>
        </div>
      </div>
      {meds.length > 0 && (
        <div className="alert-chip">
          <div className="alert-dot" />
          <div className="alert-txt"><strong>{t.alertPrefix}</strong> Renouvellement {meds[0].name} {t.alertSuffix}</div>
        </div>
      )}
      <div className="sec-label">{t.summaryLabel}</div>
      <div className="qstats">
        <div className="qs" onClick={() => nav('dossier')}><div className="qs-icon">💊</div><div className="qs-val">{meds.length}</div><div className="qs-lbl">{t.treatments}</div></div>
        <div className="qs" onClick={() => nav('doctors')}><div className="qs-icon">👨‍⚕️</div><div className="qs-val">{doctors.length}</div><div className="qs-lbl">{t.doctors}</div></div>
        <div className="qs" onClick={() => nav('suivi')}><div className="qs-icon">📊</div><div className="qs-val">3</div><div className="qs-lbl">{t.metrics}</div></div>
      </div>
      <div className="sec-label">{t.quickActions}</div>
      <div className="action-list">
        {[
          { icon: '🔳', bg: 'rgba(0,201,141,.12)', title: t.actQr, sub: t.actQrSub, screen: 'qr' },
          { icon: '📋', bg: 'rgba(77,159,236,.12)', title: t.actDossier, sub: t.actDossierSub, screen: 'dossier' },
          { icon: '👨‍⚕️', bg: 'rgba(255,209,102,.12)', title: t.actDoctors, sub: t.actDoctorsSub, screen: 'doctors' },
          { icon: '❤️', bg: 'rgba(255,90,90,.12)', title: t.actSuivi, sub: t.actSuiviSub, screen: 'suivi' },
        ].map((a, i) => (
          <div key={i} className="action-row" onClick={() => nav(a.screen)}>
            <div className="ar-icon" style={{ background: a.bg }}>{a.icon}</div>
            <div className="ar-text"><div className="ar-title">{a.title}</div><div className="ar-sub">{a.sub}</div></div>
            <div className="ar-arrow">›</div>
          </div>
        ))}
      </div>
      <div className="pad-b" />
    </div>
  )
}

function QRScreen({ lang, nav, profile, allergies, antecedents, showToast }) {
  const t = T[lang]
  const qrRef = useRef(null)
  useEffect(() => {
    if (!qrRef.current) return
    const try_ = () => {
      if (window.QRCode) {
        qrRef.current.innerHTML = ''
        new window.QRCode(qrRef.current, { text: `VitaPass|${profile.fname} ${profile.lname}|${profile.dob}|${profile.blood}`, width: 170, height: 170, colorDark: '#0A1628', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M })
      } else setTimeout(try_, 300)
    }
    try_()
  }, [profile])
  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">{t.qrTitle}</div></div>
      <div className="qr-wrap">
        <div className="emergency-bar"><span style={{ fontSize: 22 }}>🚨</span><div className="emg-txt">{t.emergencyTxt}</div></div>
        <div className="qr-card">
          <div className="qr-tag">{t.qrTag}</div>
          <div className="qr-box"><div ref={qrRef} /></div>
          <div className="qr-pname">{profile.fname} {profile.lname}</div>
          <div className="qr-pinfo">{formatDate(profile.dob)} · {profile.blood} · {profile.wilaya}</div>
          <div className="qr-chips">
            {allergies.map(a => <span key={a} className="badge badge-r">⚠️ {a}</span>)}
            {antecedents.filter(a => a.type === 'Chronique').slice(0,2).map(a => <span key={a.id} className="badge badge-y">{a.name}</span>)}
          </div>
        </div>
        <div className="qr-actions">
          {[['📤', t.shareBtn],['🖨️', t.printBtn],['📡', t.nfcBtn],['🔒', t.securityBtn]].map(([icon, lbl], i) => (
            <div key={i} className="qa-btn" onClick={() => showToast(t.copied)}><div className="qa-icon">{icon}</div><div className="qa-lbl">{lbl}</div></div>
          ))}
        </div>
        <div className="nfc-row"><span style={{ fontSize: 24 }}>📡</span><div><div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--white)' }}>{t.nfcTitle}</div><div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{t.nfcSub}</div></div></div>
        <div className="sec-label">{t.scansLabel}</div>
        {[['var(--g)', t.scan1, t.scan1t],['var(--blue)', t.scan2, t.scan2t],['var(--yellow)', t.scan3, t.scan3t]].map(([dot, txt, time], i) => (
          <div key={i} className="scan-item"><div className="sl-dot" style={{ background: dot }} /><div className="sl-txt">{txt}</div><div className="sl-time">{time}</div></div>
        ))}
        <div className="pad-b" />
      </div>
    </div>
  )
}

function DossierScreen({ lang, nav, meds, setMeds, allergies, setAllergies, antecedents, setAntecedents, vaccins, setVaccins, docs, setDocs, showToast }) {
  const t = T[lang]
  const [activeTab, setActiveTab] = useState('meds')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const tabs = [{ id: 'meds', label: t.tabMeds }, { id: 'ant', label: t.tabAnt }, { id: 'vacc', label: t.tabVacc }, { id: 'docs', label: t.tabDocs }]
  const icons = { Chronique: '🩺', Hospitalisation: '🏥', Chirurgie: '🔪', Autre: '📋' }
  const docIcons = { Analyse: '🧪', 'Radio / IRM': '🫁', Ordonnance: '💊', 'Compte rendu': '📝' }

  const save = () => {
    if (modal === 'med') { if (!form.name) return; const u = [...meds, { id: Date.now(), name: form.name, dose: form.dose || '', reason: form.reason || '', doc: form.doc || '' }]; setMeds(u); LS.set('meds', u) }
    else if (modal === 'allergy') { if (!form.name) return; const u = [...allergies, form.name]; setAllergies(u); LS.set('allergies', u) }
    else if (modal === 'ant') { if (!form.name) return; const u = [...antecedents, { id: Date.now(), name: form.name, year: form.year || '', type: form.type || 'Chronique' }]; setAntecedents(u); LS.set('antecedents', u) }
    else if (modal === 'vacc') { if (!form.name) return; const u = [...vaccins, { id: Date.now(), name: form.name, date: form.date || '', status: form.status || 'done' }]; setVaccins(u); LS.set('vaccins', u) }
    else if (modal === 'doc') { if (!form.title) return; const u = [...docs, { id: Date.now(), title: form.title, date: form.date || '', type: form.type || 'Analyse', result: form.result || '' }]; setDocs(u); LS.set('docs', u) }
    setModal(null); setForm({}); showToast(t.saved)
  }

  const rm = (arr, setArr, key, id) => { const u = arr.filter(x => x.id !== id); setArr(u); LS.set(key, u); showToast(t.deleted) }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">{t.dossierTitle}</div></div>
      <div className="tabs">{tabs.map(tab => <div key={tab.id} className={`tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</div>)}</div>

      {activeTab === 'meds' && <>
        <div className="dsect-title">{t.enCours}</div>
        {meds.length === 0 ? <div className="empty-state"><div className="empty-icon">💊</div><p>{t.noMeds}</p></div>
          : meds.map(m => <div key={m.id} className="card"><div className="card-row"><div className="card-icon" style={{ background: 'rgba(0,201,141,.1)' }}>💊</div><div className="card-info"><div className="card-name">{m.name}</div><div className="card-sub">{m.dose}{m.reason ? ' · ' + m.reason : ''}</div></div><span className="badge badge-g">{t.actif}</span><span onClick={() => rm(meds, setMeds, 'meds', m.id)} style={{ cursor: 'pointer', color: 'var(--dim)', fontSize: 18, padding: 4 }}>✕</span></div></div>)}
        <div className="add-btn" onClick={() => { setModal('med'); setForm({}) }}>＋ {t.addMed}</div>
        <div className="dsect-title">{t.allergiesLabel}</div>
        <div className="allergy-wrap">{allergies.map((a, i) => <span key={i} className="achip">⚠️ {a}<span className="achip-rm" onClick={() => { const u = allergies.filter((_,j) => j !== i); setAllergies(u); LS.set('allergies', u); showToast(t.deleted) }}>✕</span></span>)}</div>
        <div className="add-btn" onClick={() => { setModal('allergy'); setForm({}) }}>＋ {t.addAllergy}</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'ant' && <>
        <div className="dsect-title">{t.chroniques}</div>
        {antecedents.length === 0 ? <div className="empty-state"><div className="empty-icon">📋</div><p>{t.noAnt}</p></div>
          : antecedents.map(a => <div key={a.id} className="card"><div className="card-row"><div className="card-icon" style={{ background: 'rgba(255,209,102,.1)' }}>{icons[a.type] || '📋'}</div><div className="card-info"><div className="card-name">{a.name}</div><div className="card-sub">{a.type}{a.year ? ' · ' + a.year : ''}</div></div><span className="badge badge-r">{a.type}</span><span onClick={() => rm(antecedents, setAntecedents, 'antecedents', a.id)} style={{ cursor: 'pointer', color: 'var(--dim)', fontSize: 18, padding: 4 }}>✕</span></div></div>)}
        <div className="add-btn" onClick={() => { setModal('ant'); setForm({ type: 'Chronique' }) }}>＋ {t.addAnt}</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'vacc' && <>
        <div className="dsect-title">{t.vaccinsLabel}</div>
        {vaccins.map(v => <div key={v.id} className="vacc-row"><div><div className="vacc-name">{v.name}</div><div className="vacc-date">{v.date ? formatDate(v.date) : 'Recommandé'}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="vacc-ico" style={{ background: v.status === 'done' ? 'rgba(0,201,141,.15)' : 'rgba(255,209,102,.15)' }}>{v.status === 'done' ? '✅' : '⏳'}</div><span onClick={() => rm(vaccins, setVaccins, 'vaccins', v.id)} style={{ cursor: 'pointer', color: 'var(--dim)', fontSize: 16 }}>✕</span></div></div>)}
        <div className="add-btn" onClick={() => { setModal('vacc'); setForm({ status: 'done' }) }}>＋ {t.addVacc}</div>
        <div className="pad-b" />
      </>}

      {activeTab === 'docs' && <>
        <div className="dsect-title">{t.docsLabel}</div>
        {docs.length === 0 ? <div className="empty-state"><div className="empty-icon">📄</div><p>{t.noDocs}</p></div>
          : docs.map(d => <div key={d.id} className="card"><div className="card-row"><div className="card-icon" style={{ background: 'rgba(77,159,236,.1)' }}>{docIcons[d.type] || '📄'}</div><div className="card-info"><div className="card-name">{d.title}</div><div className="card-sub">{d.date ? formatDate(d.date) : ''}{d.result ? ' · ' + d.result : ''}</div></div><span className="badge badge-g">PDF</span><span onClick={() => rm(docs, setDocs, 'docs', d.id)} style={{ cursor: 'pointer', color: 'var(--dim)', fontSize: 18, padding: 4 }}>✕</span></div></div>)}
        <div className="add-btn" onClick={() => { setModal('doc'); setForm({ type: 'Analyse' }) }}>＋ {t.addDoc}</div>
        <div className="pad-b" />
      </>}

      {modal === 'med' && <Modal title={t.addMed} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Nom</label><input className="form-input" placeholder="Metformine 850mg" onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Posologie</label><input className="form-input" placeholder="2x/jour" onChange={e => setForm({ ...form, dose: e.target.value })} /></div><div className="form-group"><label className="form-label">Indication</label><input className="form-input" placeholder="Diabète" onChange={e => setForm({ ...form, reason: e.target.value })} /></div></div><button className="btn-submit" onClick={save}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'allergy' && <Modal title={t.addAllergy} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Allergie</label><input className="form-input" placeholder="Pénicilline" onChange={e => setForm({ ...form, name: e.target.value })} /></div><button className="btn-submit" onClick={save}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'ant' && <Modal title={t.addAnt} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Condition</label><input className="form-input" placeholder="Diabète de type 2" onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Année</label><input className="form-input" type="number" placeholder="2018" onChange={e => setForm({ ...form, year: e.target.value })} /></div><div className="form-group"><label className="form-label">Type</label><select className="form-select" onChange={e => setForm({ ...form, type: e.target.value })}>{['Chronique','Hospitalisation','Chirurgie','Autre'].map(o => <option key={o}>{o}</option>)}</select></div></div><button className="btn-submit" onClick={save}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'vacc' && <Modal title={t.addVacc} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Vaccin</label><input className="form-input" placeholder="BCG, Covid-19..." onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" onChange={e => setForm({ ...form, date: e.target.value })} /></div><div className="form-group"><label className="form-label">Statut</label><select className="form-select" onChange={e => setForm({ ...form, status: e.target.value })}><option value="done">✅ Fait</option><option value="pending">⏳ À faire</option></select></div></div><button className="btn-submit" onClick={save}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'doc' && <Modal title={t.addDoc} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" placeholder="NFS complète" onChange={e => setForm({ ...form, title: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" onChange={e => setForm({ ...form, date: e.target.value })} /></div><div className="form-group"><label className="form-label">Type</label><select className="form-select" onChange={e => setForm({ ...form, type: e.target.value })}>{['Analyse','Radio / IRM','Ordonnance','Compte rendu'].map(o => <option key={o}>{o}</option>)}</select></div></div><div className="form-group"><label className="form-label">Résultat</label><input className="form-input" placeholder="Normal" onChange={e => setForm({ ...form, result: e.target.value })} /></div><button className="btn-submit" onClick={save}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
    </div>
  )
}

function DoctorsScreen({ lang, nav, doctors, setDoctors, rdvs, setRdvs, showToast }) {
  const t = T[lang]
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ wilaya: 'Oran', access: 'full' })
  const months = { fr: ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'], ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] }
  const bgColors = ['rgba(0,201,141,.1)','rgba(77,159,236,.1)','rgba(255,209,102,.1)','rgba(255,90,90,.1)']
  const avatars = ['👨‍⚕️','👩‍⚕️']

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">{t.doctorsTitle}</div></div>
      <div className="add-btn" onClick={() => { setModal('doctor'); setForm({ wilaya: 'Oran', access: 'full' }) }}>＋ {t.addDoctor}</div>
      <div className="sec-label">{t.authorized}</div>
      {doctors.length === 0 ? <div className="empty-state"><div className="empty-icon">👨‍⚕️</div><p>{t.noDoctors}</p></div>
        : doctors.map((d, i) => <div key={d.id} className="doc-card"><div className="doc-top"><div className="doc-avatar" style={{ background: bgColors[i % 4] }}>{avatars[i % 2]}</div><div><div className="doc-name">{d.name}</div><div className="doc-spec">{d.spec}</div><div className="doc-loc">📍 {d.wilaya}</div></div></div><div className="doc-btns"><div className="doc-btn doc-btn-full">{d.access === 'full' ? t.accessFull : t.accessLimited}</div><div className="doc-btn doc-btn-rev" onClick={() => { const u = doctors.filter(x => x.id !== d.id); setDoctors(u); LS.set('doctors', u); showToast(t.deleted) }}>{t.revoke}</div></div></div>)}

      <div className="divider" />
      <div className="sec-label">{t.rdvLabel}</div>
      {rdvs.length === 0 ? <div className="empty-state"><div className="empty-icon">📅</div><p>{t.noRdv}</p></div>
        : rdvs.map(r => { const d = r.date ? new Date(r.date) : new Date(); return <div key={r.id} className="rdv-card"><div className="rdv-date"><div className="rdv-day">{d.getDate()}</div><div className="rdv-month">{months[lang][d.getMonth()]}</div></div><div style={{ flex: 1 }}><div className="rdv-title">{r.title}{r.time ? ' · ' + r.time : ''}</div><div className="rdv-detail">{r.detail}</div></div><span onClick={() => { const u = rdvs.filter(x => x.id !== r.id); setRdvs(u); LS.set('rdvs', u); showToast(t.deleted) }} style={{ cursor: 'pointer', color: 'var(--dim)', fontSize: 18 }}>✕</span></div> })}
      <div className="add-btn" onClick={() => { setModal('rdv'); setForm({}) }}>＋ {t.addRdv}</div>

      <div className="divider" />
      <div className="sec-label">{t.urgencesLabel}</div>
      <div className="urg-grid">
        <div className="urg-btn"><div style={{ fontSize: 22 }}>🚑</div><div className="urg-num">14</div><div className="urg-lbl">{t.pompiers}</div></div>
        <div className="urg-btn"><div style={{ fontSize: 22 }}>🏥</div><div className="urg-num">115</div><div className="urg-lbl">SAMU</div></div>
      </div>
      <div className="hosp-btn"><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{t.findHosp}</div><div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 3 }}>{t.wilayasCovered}</div></div>
      <div className="pad-b" />

      {modal === 'doctor' && <Modal title={t.addDoctor} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Nom complet</label><input className="form-input" placeholder="Dr. Nom Prénom" onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="form-group"><label className="form-label">Spécialité</label><input className="form-input" placeholder="Cardiologue" onChange={e => setForm({ ...form, spec: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Wilaya</label><select className="form-select" defaultValue="Oran" onChange={e => setForm({ ...form, wilaya: e.target.value })}>{WILAYAS.map(w => <option key={w}>{w}</option>)}</select></div><div className="form-group"><label className="form-label">Accès</label><select className="form-select" onChange={e => setForm({ ...form, access: e.target.value })}><option value="full">Complet</option><option value="limited">Partiel</option></select></div></div><button className="btn-submit" onClick={() => { if (!form.name) return; const u = [...doctors, { id: Date.now(), ...form }]; setDoctors(u); LS.set('doctors', u); setModal(null); showToast(t.saved) }}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'rdv' && <Modal title={t.addRdv} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" placeholder="Consultation cardiologie" onChange={e => setForm({ ...form, title: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" onChange={e => setForm({ ...form, date: e.target.value })} /></div><div className="form-group"><label className="form-label">Heure</label><input className="form-input" type="time" onChange={e => setForm({ ...form, time: e.target.value })} /></div></div><div className="form-group"><label className="form-label">Médecin / Lieu</label><input className="form-input" placeholder="Dr. Meziane · Oran" onChange={e => setForm({ ...form, detail: e.target.value })} /></div><button className="btn-submit" onClick={() => { if (!form.title) return; const u = [...rdvs, { id: Date.now(), ...form }]; setRdvs(u); LS.set('rdvs', u); setModal(null); showToast(t.saved) }}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
    </div>
  )
}

function SuiviScreen({ lang, nav, glyc, setGlyc, bp, setBp, weight, setWeight, family, setFamily, meds, showToast }) {
  const t = T[lang]
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const today = new Date().toISOString().split('T')[0]
  const famEmojis = { Enfant: '👶', 'Conjoint(e)': '💑', Parent: '👴', 'Frère/Sœur': '👫' }
  const lastGlyc = glyc.length > 0 ? glyc[glyc.length - 1] : null
  const lastBp = bp.length > 0 ? bp[bp.length - 1] : null
  const lastW = weight.length > 0 ? weight[weight.length - 1] : null

  const saveMetric = () => {
    if (modal === 'glyc') { const v = parseFloat(form.val); if (!v) return; const u = [...glyc, v].slice(-7); setGlyc(u); LS.set('glyc', u) }
    else if (modal === 'bp') { const s = parseInt(form.s), d = parseInt(form.d); if (!s || !d) return; const u = [...bp, { s, d }].slice(-7); setBp(u); LS.set('bp', u) }
    else if (modal === 'weight') { const v = parseFloat(form.val); if (!v) return; const u = [...weight, v].slice(-7); setWeight(u); LS.set('weight', u) }
    else if (modal === 'family') { if (!form.name) return; const u = [...family, { name: form.name, age: form.age || '', rel: form.rel || 'Enfant' }]; setFamily(u); LS.set('family', u) }
    setModal(null); setForm({}); showToast(t.saved)
  }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr"><div className="back-btn" onClick={() => nav('home')}>←</div><div className="shdr-title">{t.suiviTitle}</div></div>
      <div className="sec-label">{t.metricsLabel}</div>
      <div className="metric-card" onClick={() => { setModal('glyc'); setForm({ date: today }) }}>
        <div className="mc-hdr"><div className="mc-left"><span style={{ fontSize: 22 }}>🩸</span><div><div className="mc-title">{t.glycTitle}</div><div className="mc-sub">{t.glycSub}</div></div></div><div><span className="mc-val">{lastGlyc ?? '--'}</span><span className="mc-unit"> %</span></div></div>
        <MiniChart data={glyc} />
        <div className={`mc-trend${lastGlyc && lastGlyc >= 7.5 ? ' warn' : ''}`}>{lastGlyc ? (lastGlyc < 7.5 ? '↓ Dans les objectifs' : '↗ Élevé · Surveiller') : '+ Ajouter une mesure'}</div>
      </div>
      <div className="metric-card" onClick={() => { setModal('bp'); setForm({ date: today }) }}>
        <div className="mc-hdr"><div className="mc-left"><span style={{ fontSize: 22 }}>❤️</span><div><div className="mc-title">{t.bpTitle}</div><div className="mc-sub">{t.bpSub}</div></div></div><div><span className="mc-val">{lastBp ? lastBp.s : '--'}</span><span className="mc-unit">{lastBp ? '/' + lastBp.d : ''}</span></div></div>
        <MiniChart data={bp.map(b => b.s)} />
        <div className={`mc-trend${lastBp && lastBp.s > 130 ? ' warn' : ''}`}>{lastBp ? (lastBp.s > 130 ? '↗ Élevé · Surveiller' : '↓ Normal') : '+ Ajouter une mesure'}</div>
      </div>
      <div className="metric-card" onClick={() => { setModal('weight'); setForm({ date: today }) }}>
        <div className="mc-hdr"><div className="mc-left"><span style={{ fontSize: 22 }}>⚖️</span><div><div className="mc-title">{t.weightTitle}</div><div className="mc-sub">{t.weightSub}</div></div></div><div><span className="mc-val">{lastW ?? '--'}</span><span className="mc-unit"> kg</span></div></div>
        <MiniChart data={weight} />
        <div className="mc-trend">{lastW && weight.length > 1 ? `${weight[0] > lastW ? '↓' : '↑'} ${Math.abs(weight[0] - lastW).toFixed(1)}kg` : '+ Ajouter une mesure'}</div>
      </div>
      <div className="divider" />
      <div className="sec-label">{t.familyLabel}</div>
      <div className="family-row">
        {family.map((f, i) => <div key={i} className="fam-card"><div className="fam-av">{famEmojis[f.rel] || '👤'}</div><div className="fam-name">{f.name}</div><div className="fam-age">{f.age} {t.ans} · {f.rel}</div></div>)}
        <div className="fam-add" onClick={() => { setModal('family'); setForm({ rel: 'Enfant' }) }}><span>＋</span><span style={{ fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: 'var(--g)' }}>{t.addFam}</span></div>
      </div>
      <div className="divider" />
      <div className="sec-label">{t.remindersLabel}</div>
      {meds.length === 0 ? <div className="empty-state"><div className="empty-icon">🔔</div><p>{t.noReminders}</p></div>
        : meds.slice(0,3).map(m => <div key={m.id} className="reminder-row"><span style={{ fontSize: 20 }}>💊</span><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, color: 'var(--white)' }}>{m.name}</div><div style={{ fontSize: 12, color: 'var(--dim)' }}>{m.dose}</div></div><div className="toggle"><div className="toggle-knob" /></div></div>)}
      <div className="pad-b" />

      {modal === 'glyc' && <Modal title={t.glycTitle} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Valeur (%)</label><input className="form-input" type="number" step="0.1" placeholder="7.2" onChange={e => setForm({ ...form, val: e.target.value })} /></div><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" defaultValue={today} onChange={e => setForm({ ...form, date: e.target.value })} /></div><button className="btn-submit" onClick={saveMetric}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'bp' && <Modal title={t.bpTitle} onClose={() => setModal(null)}><div className="form-row"><div className="form-group"><label className="form-label">Systolique</label><input className="form-input" type="number" placeholder="128" onChange={e => setForm({ ...form, s: e.target.value })} /></div><div className="form-group"><label className="form-label">Diastolique</label><input className="form-input" type="number" placeholder="82" onChange={e => setForm({ ...form, d: e.target.value })} /></div></div><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" defaultValue={today} onChange={e => setForm({ ...form, date: e.target.value })} /></div><button className="btn-submit" onClick={saveMetric}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'weight' && <Modal title={t.weightTitle} onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Poids (kg)</label><input className="form-input" type="number" step="0.1" placeholder="82" onChange={e => setForm({ ...form, val: e.target.value })} /></div><div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" defaultValue={today} onChange={e => setForm({ ...form, date: e.target.value })} /></div><button className="btn-submit" onClick={saveMetric}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
      {modal === 'family' && <Modal title="Ajouter un membre" onClose={() => setModal(null)}><div className="form-group"><label className="form-label">Prénom</label><input className="form-input" placeholder="Lina" onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="form-row"><div className="form-group"><label className="form-label">Âge</label><input className="form-input" type="number" placeholder="3" onChange={e => setForm({ ...form, age: e.target.value })} /></div><div className="form-group"><label className="form-label">Lien</label><select className="form-select" onChange={e => setForm({ ...form, rel: e.target.value })}>{['Enfant','Conjoint(e)','Parent','Frère/Sœur'].map(o => <option key={o}>{o}</option>)}</select></div></div><button className="btn-submit" onClick={saveMetric}>Enregistrer</button><button className="btn-cancel" onClick={() => setModal(null)}>{t.annuler}</button></Modal>}
    </div>
  )
}

function ProfileScreen({ lang, nav, profile, setProfile, toggleLang, showToast }) {
  const t = T[lang]
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(profile)
  const age = profile.dob ? new Date().getFullYear() - parseInt(profile.dob.split('-')[0]) : ''
  const save = () => { setProfile(form); LS.set('profile', form); setModal(false); showToast(t.saved) }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="profile-hero">
        <div className="p-av-wrap"><div className="p-av">👨</div><div className="p-badge">✅</div></div>
        <div className="p-name">{profile.fname} {profile.lname}</div>
        <div className="p-id">ID : VP-DZ-{profile.dob?.replace(/-/g,'').slice(0,8)}-0042</div>
        <div className="p-chips"><span className="pchip">🩸 {profile.blood}</span><span className="pchip">📍 {profile.wilaya}</span><span className="pchip">{age} {t.ans}</span></div>
      </div>
      <div style={{ height: 20 }} />
      <div className="sec-label">{t.personalInfo}</div>
      <div className="pinfo-list">
        {[[t.fnameLabel, profile.fname],[t.lnameLabel, profile.lname],[t.dobLabel, formatDate(profile.dob)],[t.genderLabel, profile.gender],[t.wilayaLabel, profile.wilaya],[t.bloodLabel, profile.blood],[t.cnasLabel, profile.cnas],[t.emergencyLabel, profile.emergency]].map(([k, v], i) => (
          <div key={i} className="pinfo-row"><span className="pi-key">{k}</span><span className="pi-val">{v}</span></div>
        ))}
      </div>
      <div className="add-btn" onClick={() => { setForm(profile); setModal(true) }}>✏️ {t.editProfile}</div>
      <div className="sec-label">{t.settingsLabel}</div>
      <div className="settings-list">
        {[['🔐', t.sSecurity],['🔔', t.sNotifs],['🌐', t.sLang, toggleLang],['📋', t.sJournal],['💾', t.sBackup],['ℹ️', t.sAbout]].map(([icon, label, fn], i) => (
          <div key={i} className="si" onClick={fn || (() => showToast('…'))}><span className="si-icon">{icon}</span><span className="si-text">{label}</span><span className="si-arrow">›</span></div>
        ))}
      </div>
      <div className="logout-btn" onClick={() => showToast('Au revoir 👋')}>{t.logout}</div>

      {modal && <Modal title={t.editProfile} onClose={() => setModal(false)}>
        <div className="form-row"><div className="form-group"><label className="form-label">{t.fnameLabel}</label><input className="form-input" defaultValue={profile.fname} onChange={e => setForm({ ...form, fname: e.target.value })} /></div><div className="form-group"><label className="form-label">{t.lnameLabel}</label><input className="form-input" defaultValue={profile.lname} onChange={e => setForm({ ...form, lname: e.target.value })} /></div></div>
        <div className="form-group"><label className="form-label">{t.dobLabel}</label><input className="form-input" type="date" defaultValue={profile.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
        <div className="form-row"><div className="form-group"><label className="form-label">{t.bloodLabel}</label><select className="form-select" defaultValue={profile.blood} onChange={e => setForm({ ...form, blood: e.target.value })}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}</select></div><div className="form-group"><label className="form-label">{t.genderLabel}</label><select className="form-select" defaultValue={profile.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Masculin</option><option>Féminin</option></select></div></div>
        <div className="form-group"><label className="form-label">{t.wilayaLabel}</label><select className="form-select" defaultValue={profile.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })}>{WILAYAS.map(w => <option key={w}>{w}</option>)}</select></div>
        <div className="form-group"><label className="form-label">{t.cnasLabel}</label><input className="form-input" defaultValue={profile.cnas} onChange={e => setForm({ ...form, cnas: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">{t.emergencyLabel}</label><input className="form-input" defaultValue={profile.emergency} onChange={e => setForm({ ...form, emergency: e.target.value })} /></div>
        <button className="btn-submit" onClick={save}>Enregistrer</button>
        <button className="btn-cancel" onClick={() => setModal(false)}>{t.annuler}</button>
      </Modal>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [splash, setSplash] = useState(true)
  const [screen, setScreen] = useState('home')
  const [lang, setLang] = useState('fr')
  const [toast, setToast] = useState(null)
  const [clock, setClock] = useState('')

  const [profile, setProfile] = useState(DEFAULTS.profile)
  const [meds, setMeds] = useState(DEFAULTS.meds)
  const [allergies, setAllergies] = useState(DEFAULTS.allergies)
  const [antecedents, setAntecedents] = useState(DEFAULTS.antecedents)
  const [vaccins, setVaccins] = useState(DEFAULTS.vaccins)
  const [docs, setDocs] = useState(DEFAULTS.docs)
  const [doctors, setDoctors] = useState(DEFAULTS.doctors)
  const [rdvs, setRdvs] = useState(DEFAULTS.rdvs)
  const [glyc, setGlyc] = useState(DEFAULTS.glyc)
  const [bp, setBp] = useState(DEFAULTS.bp)
  const [weight, setWeight] = useState(DEFAULTS.weight)
  const [family, setFamily] = useState(DEFAULTS.family)

  useEffect(() => {
    setTimeout(() => setSplash(false), 2200)
    const tick = () => { const n = new Date(); setClock(`${n.getHours()}:${String(n.getMinutes()).padStart(2,'0')}`) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2000) }
  const toggleLang = () => setLang(l => l === 'fr' ? 'ar' : 'fr')
  const nav = s => setScreen(s)
  const t = T[lang]

  const navItems = [
    { id: 'home', icon: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>, label: t['nav-home'] },
    { id: 'qr', icon: <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2z"/>, label: t['nav-qr'] },
    { id: 'dossier', icon: <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>, label: t['nav-dossier'] },
    { id: 'doctors', icon: <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>, label: t['nav-doctors'] },
    { id: 'profile', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>, label: t['nav-profile'] },
  ]

  const shared = { lang, nav, showToast }

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
                <path d="M38 53l6 6 8-12 7 9 4-5 5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <defs><linearGradient id="sg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#00C98D"/><stop offset="1" stopColor="#005E42"/></linearGradient></defs>
              </svg>
            </div>
            <div className="sp-name">Vita<span>Pass</span></div>
            <div className="sp-sub">Ton carnet de santé digital</div>
          </div>
          <div className="sp-bar"><div className="sp-fill" /></div>
        </div>
      )}

      <div className="sbar">
        <span className="sbar-time">{clock}</span>
        <div className="sbar-right">
          <div className="lang-toggle" onClick={toggleLang}>{t.langBtn}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
        </div>
      </div>

      <div className="screens">
        {screen === 'home' && <HomeScreen {...shared} profile={profile} meds={meds} doctors={doctors} />}
        {screen === 'qr' && <QRScreen {...shared} profile={profile} allergies={allergies} antecedents={antecedents} />}
        {screen === 'dossier' && <DossierScreen {...shared} meds={meds} setMeds={setMeds} allergies={allergies} setAllergies={setAllergies} antecedents={antecedents} setAntecedents={setAntecedents} vaccins={vaccins} setVaccins={setVaccins} docs={docs} setDocs={setDocs} />}
        {screen === 'doctors' && <DoctorsScreen {...shared} doctors={doctors} setDoctors={setDoctors} rdvs={rdvs} setRdvs={setRdvs} />}
        {screen === 'suivi' && <SuiviScreen {...shared} glyc={glyc} setGlyc={setGlyc} bp={bp} setBp={setBp} weight={weight} setWeight={setWeight} family={family} setFamily={setFamily} meds={meds} />}
        {screen === 'profile' && <ProfileScreen {...shared} profile={profile} setProfile={setProfile} toggleLang={toggleLang} />}
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