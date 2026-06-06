/**
 * VitaPass — Templates emails séquence médecins
 * De : Samir, fondateur VitaPass
 */

// ─── J+0 : Premier contact ───────────────────────────────────────────────────
export function getEmailJ0(lead) {
  const firstName = lead.full_name.split(' ')[0]

  return {
    subject: `VitaPass – Le dossier médical d'urgence pour vos patients`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Inter',Arial,sans-serif">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:24px;font-weight:800;color:#080E1E;letter-spacing:-0.5px">
        Vita<span style="color:#00C98D">Pass</span>
      </span>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <p style="margin:0 0 16px;font-size:16px;color:#374151">
        Bonjour Dr. ${firstName},
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
        Je me permets de vous contacter au sujet de <strong>VitaPass</strong>,
        une solution développée à Oran pour résoudre un problème que vous connaissez bien :
        l'absence d'informations médicales critiques lors d'une urgence.
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
        VitaPass permet à chaque patient de porter un <strong>QR code</strong> donnant accès
        instantanément à son groupe sanguin, allergies, traitements en cours et antécédents —
        sans application, sans connexion requise.
      </p>

      <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7">
        En <strong>30 secondes</strong>, vous savez tout ce qu'il faut savoir.
      </p>

      <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7">
        Je serais ravi de vous montrer comment ça fonctionne en <strong>15 minutes</strong>
        à votre convenance. Êtes-vous disponible cette semaine ?
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://vitapass.app"
           style="display:inline-block;background:#00C98D;color:#001A12;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px">
          Voir VitaPass →
        </a>
      </div>
    </div>

    <!-- Signature -->
    <div style="padding:24px 0 0;font-size:14px;color:#6B7280;line-height:1.6">
      Cordialement,<br>
      <strong style="color:#374151">Samir</strong> — Fondateur VitaPass<br>
      <a href="https://vitapass.app" style="color:#00C98D;text-decoration:none">vitapass.app</a>
    </div>

    <!-- Désabonnement -->
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF;text-align:center">
      Vous recevez cet email car votre profil est référencé dans notre base de contacts professionnels.<br>
      <a href="mailto:samir@vitapass.app?subject=Désabonnement&body=Veuillez me retirer de votre liste" style="color:#9CA3AF">
        Se désabonner
      </a>
    </div>

  </div>
</body>
</html>`,
    text: `Bonjour Dr. ${firstName},\n\nJe me permets de vous contacter au sujet de VitaPass, une solution développée à Oran pour résoudre un problème que vous connaissez bien : l'absence d'informations médicales critiques lors d'une urgence.\n\nVitaPass permet à chaque patient de porter un QR code donnant accès instantanément à son groupe sanguin, allergies, traitements en cours et antécédents — sans application, sans connexion requise.\n\nEn 30 secondes, vous savez tout ce qu'il faut savoir.\n\nJe serais ravi de vous montrer comment ça fonctionne en 15 minutes à votre convenance. Êtes-vous disponible cette semaine ?\n\nCordialement,\nSamir — Fondateur VitaPass\nhttps://vitapass.app`,
  }
}

// ─── J+3 : Relance douce ──────────────────────────────────────────────────────
export function getEmailJ3(lead) {
  const firstName = lead.full_name.split(' ')[0]

  return {
    subject: `Re: VitaPass – Une question rapide`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Inter',Arial,sans-serif">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px">

    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:24px;font-weight:800;color:#080E1E;letter-spacing:-0.5px">
        Vita<span style="color:#00C98D">Pass</span>
      </span>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <p style="margin:0 0 16px;font-size:16px;color:#374151">
        Bonjour Dr. ${firstName},
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
        Je reviens vers vous concernant <strong>VitaPass</strong>.
        Plusieurs médecins à Oran utilisent déjà la solution et la recommandent à leurs patients.
      </p>

      <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7">
        Si la question est de savoir si ça fonctionne vraiment, je peux vous partager des retours
        concrets lors d'un appel de <strong>15 minutes</strong>.
        Un simple <em>"oui"</em> en réponse et je vous propose des créneaux.
      </p>

      <div style="text-align:center;margin-bottom:24px">
        <a href="https://vitapass.app"
           style="display:inline-block;background:#00C98D;color:#001A12;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px">
          Planifier 15 min →
        </a>
      </div>
    </div>

    <div style="padding:24px 0 0;font-size:14px;color:#6B7280;line-height:1.6">
      Cordialement,<br>
      <strong style="color:#374151">Samir</strong> – VitaPass<br>
      <a href="https://vitapass.app" style="color:#00C98D;text-decoration:none">vitapass.app</a>
    </div>

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF;text-align:center">
      <a href="mailto:samir@vitapass.app?subject=Désabonnement&body=Veuillez me retirer de votre liste" style="color:#9CA3AF">
        Se désabonner
      </a>
    </div>

  </div>
</body>
</html>`,
    text: `Bonjour Dr. ${firstName},\n\nJe reviens vers vous concernant VitaPass. Plusieurs médecins à Oran utilisent déjà la solution et la recommandent à leurs patients.\n\nSi la question est de savoir si ça fonctionne vraiment, je peux vous partager des retours concrets lors d'un appel de 15 minutes. Un simple "oui" en réponse et je vous propose des créneaux.\n\nCordialement,\nSamir – VitaPass\nhttps://vitapass.app`,
  }
}

// ─── J+7 : Dernier message ────────────────────────────────────────────────────
export function getEmailJ7(lead) {
  const firstName = lead.full_name.split(' ')[0]

  return {
    subject: `VitaPass – Mon dernier message`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Inter',Arial,sans-serif">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px">

    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:24px;font-weight:800;color:#080E1E;letter-spacing:-0.5px">
        Vita<span style="color:#00C98D">Pass</span>
      </span>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <p style="margin:0 0 16px;font-size:16px;color:#374151">
        Bonjour Dr. ${firstName},
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
        C'est mon dernier message, je ne veux pas vous importuner.
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
        Si <strong>VitaPass</strong> ne correspond pas à vos priorités actuelles,
        c'est tout à fait compréhensible.
      </p>

      <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7">
        Si en revanche vous souhaitez voir comment un QR code peut sauver la vie d'un de vos patients,
        la porte reste ouverte :
        <a href="https://vitapass.app" style="color:#00C98D">vitapass.app</a>
      </p>

      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7">
        Bonne continuation,
      </p>
    </div>

    <div style="padding:24px 0 0;font-size:14px;color:#6B7280;line-height:1.6">
      <strong style="color:#374151">Samir</strong> – VitaPass<br>
      <a href="https://vitapass.app" style="color:#00C98D;text-decoration:none">vitapass.app</a>
    </div>

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF;text-align:center">
      <a href="mailto:samir@vitapass.app?subject=Désabonnement&body=Veuillez me retirer de votre liste" style="color:#9CA3AF">
        Se désabonner
      </a>
    </div>

  </div>
</body>
</html>`,
    text: `Bonjour Dr. ${firstName},\n\nC'est mon dernier message, je ne veux pas vous importuner.\n\nSi VitaPass ne correspond pas à vos priorités actuelles, c'est tout à fait compréhensible.\n\nSi en revanche vous souhaitez voir comment un QR code peut sauver la vie d'un de vos patients, la porte reste ouverte : https://vitapass.app\n\nBonne continuation,\nSamir – VitaPass`,
  }
}
