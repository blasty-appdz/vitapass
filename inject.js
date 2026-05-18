const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const resetFn = 
function ResetPasswordScreen() {
  const [pwd, setPwd] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) alert('Erreur : ' + error.message);
    else setDone(true);
    setLoading(false);
  };
  if (done) return (
    <div style={{position:'fixed',inset:0,background:'#080E1E',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24}}>
      <div style={{fontSize:48}}>✅</div>
      <div style={{color:'#EFF3FF',fontSize:20,fontWeight:700}}>Mot de passe modifié !</div>
      <button onClick={()=>window.location.href='https://vitapass.app'} style={{marginTop:16,background:'#00C98D',color:'#001A12',border:'none',borderRadius:12,padding:'12px 28px',fontWeight:700,cursor:'pointer'}}>Se connecter</button>
    </div>
  );
  return (
    <div style={{position:'fixed',inset:0,background:'#080E1E',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:24}}>
      <div style={{fontSize:40}}>🔐</div>
      <div style={{color:'#EFF3FF',fontSize:20,fontWeight:700}}>Nouveau mot de passe</div>
      <input type='password' placeholder='Minimum 6 caractères' value={pwd} onChange={e=>setPwd(e.target.value)} style={{width:'100%',maxWidth:340,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'12px 16px',color:'#EFF3FF',fontSize:14,outline:'none'}} />
      <button onClick={handleReset} disabled={loading||pwd.length<6} style={{width:'100%',maxWidth:340,background:'#00C98D',color:'#001A12',border:'none',borderRadius:12,padding:14,fontWeight:700,fontSize:14,cursor:'pointer'}}>{loading?'En cours...':'Valider'}</button>
    </div>
  );
}
;

code = code.replace('function Modal(', resetFn + '\nfunction Modal(');
fs.writeFileSync('src/App.jsx', code);
console.log('OK');
