export default function PrivacyScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#080E1E', color: '#F9FAFB', fontFamily: "'Inter',Arial,sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,14,30,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" style={{ textDecoration: 'none', fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, color: '#F9FAFB' }}>
          Vita<span style={{ color: '#00C98D' }}>Pass</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>
          ← Retour
        </a>
      </nav>

      {/* Contenu */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,201,141,0.1)', border: '1px solid rgba(0,201,141,0.25)', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#00C98D', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 20 }}>
            Dernière mise à jour : juin 2026
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 40, fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15, margin: '0 0 16px' }}>
            Politique de<br /><span style={{ color: '#00C98D' }}>confidentialité</span>
          </h1>
          <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.7, margin: 0 }}>
            VitaPass est conçu pour protéger votre santé — et vos données. Voici exactement comment nous les traitons.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            num: '01',
            title: 'Qui sommes-nous ?',
            content: (
              <>
                <p>VitaPass est une application algérienne de dossier médical d'urgence, développée à Oran. Elle permet à chaque utilisateur de centraliser ses informations médicales critiques et de les partager via un QR code en cas d'urgence.</p>
                <p>Responsable du traitement : <strong style={{ color: '#F9FAFB' }}>VitaPass</strong> — contact : <a href="mailto:contact@vitapass.app" style={{ color: '#00C98D', textDecoration: 'none' }}>contact@vitapass.app</a></p>
              </>
            ),
          },
          {
            num: '02',
            title: 'Quelles données collectons-nous ?',
            content: (
              <>
                <p>Nous collectons uniquement les données nécessaires au fonctionnement du dossier médical d'urgence :</p>
                <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                  <li><strong style={{ color: '#F9FAFB' }}>Identité</strong> : prénom, nom, date de naissance, genre</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Contact</strong> : adresse email, numéro CNAS, contact d'urgence</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Données médicales</strong> : groupe sanguin, allergies, médicaments en cours, antécédents médicaux, vaccins</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Documents</strong> : fichiers médicaux que vous choisissez de télécharger</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Données de localisation</strong> : wilaya (pour la recherche de médecins)</li>
                </ul>
                <p>Nous ne collectons pas de données de localisation GPS en temps réel, ni aucune donnée publicitaire.</p>
              </>
            ),
          },
          {
            num: '03',
            title: 'Pourquoi collectons-nous ces données ?',
            content: (
              <>
                <p>Vos données sont utilisées exclusivement pour :</p>
                <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                  <li>Générer votre dossier médical d'urgence accessible par QR code</li>
                  <li>Permettre à un médecin de consulter vos informations critiques en urgence</li>
                  <li>Vous proposer des rendez-vous avec des professionnels de santé</li>
                  <li>Améliorer les fonctionnalités de l'application</li>
                </ul>
                <p>Vos données de santé ne sont <strong style={{ color: '#F9FAFB' }}>jamais vendues</strong>, <strong style={{ color: '#F9FAFB' }}>jamais partagées</strong> avec des annonceurs ou des tiers commerciaux.</p>
              </>
            ),
          },
          {
            num: '04',
            title: 'Comment sont stockées vos données ?',
            content: (
              <>
                <p>Vos données sont stockées sur <strong style={{ color: '#F9FAFB' }}>Supabase</strong>, une plateforme cloud certifiée SOC 2 Type II, avec :</p>
                <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                  <li><strong style={{ color: '#F9FAFB' }}>Chiffrement en transit</strong> : toutes les communications sont chiffrées via HTTPS/TLS</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Chiffrement au repos</strong> : vos données sont chiffrées sur les serveurs</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Isolation par utilisateur</strong> : chaque dossier est protégé par des règles d'accès strictes (Row Level Security)</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Authentification sécurisée</strong> : accès protégé par email + mot de passe</li>
                </ul>
              </>
            ),
          },
          {
            num: '05',
            title: 'Qui peut accéder à vos données ?',
            content: (
              <>
                <p><strong style={{ color: '#F9FAFB' }}>Vous</strong> — vous êtes le seul à avoir accès à votre dossier complet via votre compte VitaPass.</p>
                <p><strong style={{ color: '#F9FAFB' }}>Un médecin via QR code</strong> — lorsqu'un professionnel de santé scanne votre QR Pass, il accède uniquement aux informations d'urgence essentielles que vous avez choisies de rendre visibles : groupe sanguin, allergies, médicaments, antécédents. Cet accès est temporaire et limité.</p>
                <p><strong style={{ color: '#F9FAFB' }}>L'équipe VitaPass</strong> — nos administrateurs peuvent accéder aux données dans le cadre d'interventions techniques (maintenance, support). Cet accès est tracé et limité au strict nécessaire.</p>
                <p>Aucun autre tiers n'a accès à vos données de santé.</p>
              </>
            ),
          },
          {
            num: '06',
            title: 'Conformité — Loi 18-07 Algérie',
            content: (
              <>
                <p>VitaPass respecte la <strong style={{ color: '#F9FAFB' }}>loi n° 18-07 du 10 juin 2018</strong> relative à la protection des personnes physiques dans le traitement des données à caractère personnel.</p>
                <p>Conformément à cette loi, vous disposez des droits suivants :</p>
                <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                  <li><strong style={{ color: '#F9FAFB' }}>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Droit de rectification</strong> : corriger des données inexactes</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Droit de suppression</strong> : demander l'effacement de votre compte et de toutes vos données</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Droit d'opposition</strong> : vous opposer à certains traitements</li>
                  <li><strong style={{ color: '#F9FAFB' }}>Droit à la portabilité</strong> : recevoir vos données dans un format lisible</li>
                </ul>
                <p>Pour exercer ces droits, contactez-nous à <a href="mailto:contact@vitapass.app" style={{ color: '#00C98D', textDecoration: 'none' }}>contact@vitapass.app</a>. Nous répondons dans un délai de <strong style={{ color: '#F9FAFB' }}>30 jours</strong>.</p>
              </>
            ),
          },
          {
            num: '07',
            title: 'Cookies et traceurs',
            content: (
              <>
                <p>VitaPass utilise des cookies techniques essentiels au fonctionnement de l'application (authentification, session).</p>
                <p>Nous utilisons également <strong style={{ color: '#F9FAFB' }}>Meta Pixel</strong> sur la page d'accueil publique uniquement, pour mesurer l'efficacité de nos campagnes de sensibilisation. Ce traceur ne concerne pas votre dossier médical ni votre espace personnel.</p>
              </>
            ),
          },
          {
            num: '08',
            title: 'Contact & réclamations',
            content: (
              <>
                <p>Pour toute question relative à vos données personnelles :</p>
                <p>
                  <strong style={{ color: '#F9FAFB' }}>Email</strong> : <a href="mailto:contact@vitapass.app" style={{ color: '#00C98D', textDecoration: 'none' }}>contact@vitapass.app</a><br />
                  <strong style={{ color: '#F9FAFB' }}>Site</strong> : <a href="https://vitapass.app" style={{ color: '#00C98D', textDecoration: 'none' }}>vitapass.app</a>
                </p>
                <p>En cas de litige non résolu, vous pouvez saisir l'<strong style={{ color: '#F9FAFB' }}>Autorité de Protection des Données Personnelles (APDP)</strong> d'Algérie.</p>
              </>
            ),
          },
        ].map(({ num, title, content }) => (
          <div key={num} style={{ marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#00C98D', minWidth: 28, paddingTop: 4 }}>{num}</span>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>{title}</h2>
            </div>
            <div style={{ paddingLeft: 48, fontSize: 15, color: '#9CA3AF', lineHeight: 1.8 }}>
              {content}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 16, fontSize: 13, color: '#6B7280' }}>
          Gratuit · Sans publicité · Conçu à Oran {"🇩🇿"}
        </div>
      </div>
    </div>
  )
}
