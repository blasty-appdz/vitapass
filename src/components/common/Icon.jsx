// VitaPass — jeu d'icônes (traits fins, style moderne)
// Remplace les anciens emojis : <Icon e="💊" /> ou <Icon name="pill" />

const P = {
  heart: <><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></>,
  heartPulse: <><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /><path d="M3.2 12H9l1-2 2 4 1-2h7.8" /></>,
  pill: <><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></>,
  doctor: <><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" /></>,
  activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>,
  siren: <><path d="M7 18v-6a5 5 0 0 1 10 0v6" /><path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" /><path d="M21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.9 4.9l.7.7M12 12v6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h6M9 13h6M9 17h4" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h6" /></>,
  folder: <><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></>,
  alert: <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4M12 17h.01" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  checkCircle: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  x: <><path d="M18 6 6 18M6 6l12 12" /></>,
  xCircle: <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  drop: <><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7Z" /></>,
  hospital: <><path d="M12 6v4M14 14h-4M14 18h-4M14 8h-4" /><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" /><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" /></>,
  wifiOff: <><path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-11.3-3.8M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2.3-1.7M2 2l20 20" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  wave: <><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3-2.6L8 15" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  syringe: <><path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" /></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M14.1 14.1a3 3 0 0 1-4.2-4.2" /></>,
  bone: <><path d="M17 10c.7-.7 1.7-.9 2.6-.6a2.5 2.5 0 1 0 1-4.8 2.5 2.5 0 1 0-4.9-1c.3.9.1 1.9-.6 2.6l-7.2 7.2c-.7.7-1.7.9-2.6.6a2.5 2.5 0 1 0-1 4.9 2.5 2.5 0 1 0 4.9 1c-.3-.9-.1-1.9.6-2.6Z" /></>,
  flask: <><path d="M9 3h6M10 9V3M14 9V3M10 9 4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9M7 16h10" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>,
  bellOff: <><path d="M8.7 3A6 6 0 0 1 18 8a21 21 0 0 0 .6 5M17 17H3s3-2 3-9a4.7 4.7 0 0 1 .3-1.7M10.3 21a1.9 1.9 0 0 0 3.4 0M2 2l20 20" /></>,
  message: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></>,
  edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  dotGreen: <><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" /></>,
  sos: <><circle cx="12" cy="12" r="10" /><path d="M12 7v6M12 17h.01" /></>,
  mobile: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
  printer: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></>,
  bulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  home: <><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" /></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" /></>,
  cake: <><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01" /></>,
  coffee: <><path d="M10 2v2M14 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1M6 2v2" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  sparkles: <><path d="M9.9 15.5A2 2 0 0 0 8.5 14l-6.1-1.6a.5.5 0 0 1 0-1L8.5 9.9A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0Z" /></>,
  scale: <><path d="m16 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1ZM2 16l3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1ZM7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
  ban: <><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>,
  id: <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M14 10h4M14 14h4" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>,
  share: <><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></>,
  chevronRight: <><path d="m9 18 6-6-6-6" /></>,
  chevronLeft: <><path d="m15 18-6-6 6-6" /></>,
  brain: <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18ZM12 5v13" /></>,
  ear: <><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" /><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" /></>,
  baby: <><path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" /><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" /></>,
  flower: <><circle cx="12" cy="12" r="3" /><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5M12 7.5V9M7.5 12H9M16.5 12H15M12 16.5V15" /></>,
  microscope: <><path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></>,
  puzzle: <><path d="M19.4 14.5c.3.2.6.2.9 0a2 2 0 1 0 0-3.6c-.3.2-.6.2-.9 0l-1.5-1.5c-.3-.3-.3-.8 0-1l1.5-1.6a2 2 0 1 0-2.8-2.8L15 5.5c-.3.3-.8.3-1 0l-1.5-1.5c-.2-.3-.2-.6 0-.9a2 2 0 1 0-3.6 0c.2.3.2.6 0 .9L7.4 5.5c-.3.3-.8.3-1 0L4.8 4a2 2 0 1 0-2.8 2.8l1.5 1.5c.3.3.3.8 0 1l-1.5 1.6" /></>,
  lungs: <><path d="M6.1 7.3A3 3 0 0 0 3 10v6.5a3.5 3.5 0 0 0 5.2 3.1l.9-.5a3 3 0 0 0 1.4-2.6V5a2 2 0 0 0-2-2M17.9 7.3A3 3 0 0 1 21 10v6.5a3.5 3.5 0 0 1-5.2 3.1l-.9-.5a3 3 0 0 1-1.4-2.6V5a2 2 0 0 1 2-2M12 3v7l-2 2M12 10l2 2" /></>,
  ribbon: <><path d="M12 11.2 8.4 15.8a2 2 0 0 1-3.4-.4l-.5-1a2 2 0 0 1 .3-2.2L11 5M12 11.2l3.6 4.6a2 2 0 0 0 3.4-.4l.5-1a2 2 0 0 0-.3-2.2L13 5" /><circle cx="12" cy="5" r="3" /></>,
  tooth: <><path d="M12 5.5C10 4 8 3 6 3.5S2.5 6 3 9c.4 2.3 1.6 3.7 2 6 .5 3 1 6 3 6s2-4 4-4 2 4 4 4 2.5-3 3-6c.4-2.3 1.6-3.7 2-6 .5-3-1-5-3-5.5S14 4 12 5.5Z" /></>,
  muscle: <><path d="M7 20c-2 0-4-1.5-4-4.5C3 11 7 5 10 3l2 3-2 2c1 2 3 2 4 1l3-1c2.5 0 4 2 4 5 0 4-4 7-9 7Z" /></>,
  salad: <><path d="M7 21h10M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9ZM11.4 12a3 3 0 0 1 3.7-4.5M13.6 7.2a3 3 0 0 1 5.3 1.7M6.6 12A4 4 0 0 1 12 7.5" /></>,
  zen: <><circle cx="12" cy="5" r="2" /><path d="M4 20c1.5-.5 3.5-1 8-1s6.5.5 8 1M12 7v6M7 11l5 2 5-2M8 17l4-4 4 4" /></>,
  xray: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 7v10M9 9h6M9 12h6M9 15h6" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  arrowLeft: <><path d="m12 19-7-7 7-7M19 12H5" /></>,
  arrowRight: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
}

// Correspondance emoji → icône
const E = {
  '❤️': 'heart', '❤': 'heart', '💊': 'pill', '👨‍⚕️': 'doctor', '👩‍⚕️': 'doctor', '🩺': 'doctor', '🧑‍💼': 'user',
  '👨': 'user', '👩': 'user', '👤': 'user', '👥': 'users', '📊': 'chart', '🆘': 'siren', '🚨': 'siren',
  '📅': 'calendar', '🗓️': 'calendar', '🗓': 'calendar', '📄': 'file', '📝': 'edit', '📋': 'clipboard', '📂': 'folder', '📁': 'folder',
  '⚠️': 'alert', '⚠': 'alert', '✅': 'checkCircle', '✓': 'check', '✔': 'check', '❌': 'xCircle', '✕': 'x', '⏳': 'clock', '🕐': 'clock',
  '📍': 'pin', '🩸': 'drop', '💧': 'drop', '🏥': 'hospital', '🏠': 'home', '📴': 'wifiOff', '📵': 'wifiOff', '👋': 'wave',
  '🔐': 'lock', '🔒': 'lock', '📞': 'phone', '🔍': 'search', '🚪': 'logout', '💉': 'syringe', '🌐': 'globe',
  '👁️': 'eye', '👁': 'eye', '🙈': 'eyeOff', '🦴': 'bone', '🧪': 'flask', '⚗️': 'flask', '🔬': 'microscope', '🔔': 'bell', '🔕': 'bellOff',
  '💬': 'message', '✏️': 'edit', '⏸️': 'pause', '⏸': 'pause', '🟢': 'dotGreen', '🔴': 'dotGreen', '📱': 'mobile', '🪪': 'id',
  '🖨': 'printer', '🖨️': 'printer', '💡': 'bulb', '🔗': 'link', '🗑': 'trash', '🗑️': 'trash', '📭': 'inbox', '🎂': 'cake', '☕': 'coffee',
  '✨': 'sparkles', '⚖️': 'scale', '🚫': 'ban', '🧠': 'brain', '👂': 'ear', '👶': 'baby', '🌸': 'flower', '🧩': 'puzzle', '🫁': 'lungs',
  '🎗️': 'ribbon', '🦷': 'tooth', '🤱': 'baby', '💪': 'muscle', '🥗': 'salad', '🧘': 'zen', '🩻': 'xray', '📧': 'mail', '✉️': 'mail',
}

// eslint-disable-next-line react-refresh/only-export-components
export function iconFor(emoji) {
  return E[emoji] || E[String(emoji || '').replace(/️/g, '')] || null
}

export default function Icon({ e, name, size = 18, stroke = 1.8, className = '', style }) {
  const key = name || iconFor(e)
  if (!key || !P[key]) return e ? <span className={className} style={style}>{e}</span> : null
  return (
    <svg
      className={`vp-ico ${className}`}
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {P[key]}
    </svg>
  )
}

// Enlève un emoji placé au début d'un texte (ex. "✅ Enregistré") et renvoie l'icône + le texte
const LEAD = /^\s*(\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*|[✓✕])\s*/u
// eslint-disable-next-line react-refresh/only-export-components
export function splitLeadingEmoji(text) {
  if (typeof text !== 'string') return { emoji: null, text }
  const m = text.match(LEAD)
  if (!m) return { emoji: null, text }
  return { emoji: m[1], text: text.slice(m[0].length) }
}

// Texte avec emoji de tête → icône + texte
export function IconText({ children, size = 16, gap = 6 }) {
  const { emoji, text } = splitLeadingEmoji(children)
  if (!emoji) return <>{children}</>
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap }}><Icon e={emoji} size={size} />{text}</span>
}
