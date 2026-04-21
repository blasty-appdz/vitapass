// ── DATA STORE ──
export const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem('vp_' + k)) || null; } catch { return null; } },
  set: (k, v) => localStorage.setItem('vp_' + k, JSON.stringify(v)),
};

export const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès',
  'In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Menia',
];

export const DEFAULTS = {
  profile: { fname:'Karim', lname:'Benali', dob:'1990-03-14', blood:'A+', gender:'Masculin', wilaya:'Oran', cnas:'09-3145678-01', emergency:'Fatima B. · 0550 xxxxxx' },
  meds: [
    { id:1, name:'Metformine 850mg', dose:'2x/jour', reason:'Diabète type 2', doc:'Dr. Meziane' },
    { id:2, name:'Ramipril 5mg', dose:'1x/jour matin', reason:'Hypertension', doc:'' },
    { id:3, name:'Bisoprolol 2.5mg', dose:'1x/jour', reason:'Cardio', doc:'' },
  ],
  allergies: ['Pénicilline','Arachides','Ibuprofène'],
  antecedents: [
    { id:1, name:'Diabète de type 2', year:'2018', type:'Chronique' },
    { id:2, name:'Hypertension artérielle', year:'2020', type:'Chronique' },
    { id:3, name:'Appendicectomie', year:'2005', type:'Chirurgie' },
  ],
  vaccins: [
    { id:1, name:'BCG', date:'1990-01-01', status:'done' },
    { id:2, name:'DTP · 3 doses', date:'2010-06-01', status:'done' },
    { id:3, name:'Hépatite B', date:'2008-01-01', status:'done' },
    { id:4, name:'Covid-19 (AstraZeneca)', date:'2021-05-10', status:'done' },
    { id:5, name:'Grippe saisonnière', date:'', status:'pending' },
  ],
  docs: [
    { id:1, title:'NFS complète', date:'2025-03-15', type:'Analyse', result:'Normal' },
    { id:2, title:'Glycémie HbA1c', date:'2025-04-02', type:'Analyse', result:'7.2%' },
    { id:3, title:'Radio thorax', date:'2025-01-10', type:'Radio / IRM', result:'Normal' },
  ],
  doctors: [
    { id:1, name:'Dr. Meziane Yacine', spec:'Endocrinologue · Diabétologue', wilaya:'Oran', access:'full' },
    { id:2, name:'Dr. Boudiaf Samira', spec:'Cardiologue', wilaya:'Alger', access:'limited' },
  ],
  rdvs: [
    { id:1, title:'Consultation endocrino', date:'2025-04-24', time:'10:00', detail:'Dr. Meziane · Oran' },
    { id:2, title:'Suivi cardio', date:'2025-05-08', time:'14:30', detail:'Dr. Boudiaf · Alger' },
  ],
  glyc: [6.8, 7.1, 6.9, 7.3, 7.0, 7.2],
  bp: [{s:125,d:80},{s:130,d:85},{s:122,d:79},{s:135,d:88},{s:128,d:82}],
  weight: [85, 84, 83.5, 83, 82.5, 82],
  family: [
    { name:'Lina', age:3, rel:'Enfant' },
    { name:'Mohamed', age:68, rel:'Parent' },
  ],
};

export function initData() {
  Object.keys(DEFAULTS).forEach(k => {
    if (!LS.get(k)) LS.set(k, DEFAULTS[k]);
  });
}

export function formatDate(dob) {
  if (!dob) return '';
  const [y, m, d] = dob.split('-');
  return `${d}/${m}/${y}`;
}