const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

function wrap(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6EFE9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6EFE9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#E05C2A;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
            <span style="font-size:24px;font-weight:bold;color:white;letter-spacing:-0.5px;">gali'pet 🐾</span>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:32px;border-radius:0 0 16px 16px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;text-align:center;">
            <p style="font-size:12px;color:#888;margin:0;">
              GaliPet — Votre Meilleur Ami, en une seule Appli 🐾<br>
              <a href="${CLIENT_URL}" style="color:#E05C2A;text-decoration:none;">galipet.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text, url) {
  return `<a href="${url}" style="display:inline-block;background:#E05C2A;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:20px;">${text}</a>`
}

function bookingConfirmedOwner({ ownerName, proName, serviceType, date, timeSlot, petName }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Réservation confirmée ✅</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${ownerName},</p>
    <p style="color:#555;">Votre rendez-vous a été <strong>confirmé</strong> par ${proName}.</p>

    <table style="background:#F6EFE9;border-radius:12px;padding:20px;width:100%;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Service</span><br><strong style="color:#1a1a1a;">${serviceType}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Professionnel</span><br><strong style="color:#1a1a1a;">${proName}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Date</span><br><strong style="color:#1a1a1a;">${date}</strong></td></tr>
      ${timeSlot ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Heure</span><br><strong style="color:#1a1a1a;">${timeSlot}</strong></td></tr>` : ''}
      ${petName ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Animal</span><br><strong style="color:#1a1a1a;">🐾 ${petName}</strong></td></tr>` : ''}
    </table>

    <p style="color:#555;">Vous pouvez contacter ${proName} directement via la messagerie de l'application.</p>
    ${btn('Voir ma réservation', `${CLIENT_URL}/account`)}
  `)
}

function newBookingRequestPro({ proName, ownerName, serviceType, date, timeSlot, petName }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Nouvelle demande de réservation 📅</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${proName},</p>
    <p style="color:#555;">Vous avez reçu une nouvelle demande de rendez-vous de la part de <strong>${ownerName}</strong>.</p>

    <table style="background:#F6EFE9;border-radius:12px;padding:20px;width:100%;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Client</span><br><strong style="color:#1a1a1a;">${ownerName}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Service demandé</span><br><strong style="color:#1a1a1a;">${serviceType}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Date souhaitée</span><br><strong style="color:#1a1a1a;">${date}</strong></td></tr>
      ${timeSlot ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Heure</span><br><strong style="color:#1a1a1a;">${timeSlot}</strong></td></tr>` : ''}
      ${petName ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Animal</span><br><strong style="color:#1a1a1a;">🐾 ${petName}</strong></td></tr>` : ''}
    </table>

    <p style="color:#555;">Connectez-vous pour accepter ou refuser cette demande.</p>
    ${btn('Voir la demande', `${CLIENT_URL}/pro/bookings`)}
  `)
}

function bookingCancelledOwner({ ownerName, proName, serviceType, date, cancelledBy }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Réservation annulée ❌</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${ownerName},</p>
    <p style="color:#555;">Votre réservation du <strong>${date}</strong> avec <strong>${proName}</strong> (${serviceType}) a été annulée${cancelledBy === 'professional' ? ' par le professionnel' : ''}.</p>
    <p style="color:#555;">Vous pouvez réserver un autre créneau directement depuis l'application.</p>
    ${btn('Trouver un professionnel', `${CLIENT_URL}/search`)}
  `)
}

function bookingCancelledPro({ proName, ownerName, serviceType, date }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Réservation annulée ❌</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${proName},</p>
    <p style="color:#555;">La réservation de <strong>${ownerName}</strong> du <strong>${date}</strong> (${serviceType}) a été annulée.</p>
    ${btn('Voir mon agenda', `${CLIENT_URL}/pro/calendar`)}
  `)
}

function reminderOwner({ ownerName, proName, serviceType, date, timeSlot, petName, proLocation }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Rappel — rendez-vous demain ⏰</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${ownerName},</p>
    <p style="color:#555;">N'oubliez pas votre rendez-vous <strong>demain</strong> !</p>

    <table style="background:#F6EFE9;border-radius:12px;padding:20px;width:100%;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Professionnel</span><br><strong style="color:#1a1a1a;">${proName}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Service</span><br><strong style="color:#1a1a1a;">${serviceType}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Date & heure</span><br><strong style="color:#1a1a1a;">${date}${timeSlot ? ` à ${timeSlot}` : ''}</strong></td></tr>
      ${petName ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Animal</span><br><strong style="color:#1a1a1a;">🐾 ${petName}</strong></td></tr>` : ''}
      ${proLocation ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Adresse</span><br><strong style="color:#1a1a1a;">📍 ${proLocation}</strong></td></tr>` : ''}
    </table>

    ${btn("Ouvrir l'application", `${CLIENT_URL}/account`)}
  `)
}

function reminderPro({ proName, ownerName, serviceType, date, timeSlot, petName }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Rappel — rendez-vous demain ⏰</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${proName},</p>
    <p style="color:#555;">Vous avez un rendez-vous <strong>demain</strong> avec <strong>${ownerName}</strong>.</p>

    <table style="background:#F6EFE9;border-radius:12px;padding:20px;width:100%;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Service</span><br><strong style="color:#1a1a1a;">${serviceType}</strong></td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Date & heure</span><br><strong style="color:#1a1a1a;">${date}${timeSlot ? ` à ${timeSlot}` : ''}</strong></td></tr>
      ${petName ? `<tr><td style="padding:6px 0;"><span style="color:#888;font-size:13px;">Animal</span><br><strong style="color:#1a1a1a;">🐾 ${petName}</strong></td></tr>` : ''}
    </table>

    ${btn('Voir mon agenda', `${CLIENT_URL}/pro/calendar`)}
  `)
}

function newMessageNotification({ recipientName, senderName, messagePreview, role }) {
  const link = role === 'professional' ? `${CLIENT_URL}/pro/messages` : `${CLIENT_URL}/messages`
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Nouveau message 💬</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${recipientName},</p>
    <p style="color:#555;"><strong>${senderName}</strong> vous a envoyé un message :</p>
    <blockquote style="border-left:4px solid #E05C2A;margin:16px 0;padding:12px 16px;background:#F6EFE9;border-radius:0 8px 8px 0;color:#444;font-style:italic;">
      "${messagePreview}"
    </blockquote>
    ${btn('Répondre', link)}
  `)
}

function reviewPromptOwner({ ownerName, proName, bookingId }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Comment s'est passé votre rendez-vous ? ⭐</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${ownerName},</p>
    <p style="color:#555;">Votre rendez-vous avec <strong>${proName}</strong> est terminé. Partagez votre expérience pour aider d'autres propriétaires d'animaux.</p>
    <p style="color:#888;font-size:13px;">⏳ Vous avez 14 jours pour laisser votre avis.</p>
    ${btn('Laisser un avis', `${CLIENT_URL}/review/${bookingId}`)}
  `)
}

function welcomeOwner({ name }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Bienvenue sur GaliPet 🐾</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${name},</p>
    <p style="color:#555;">Votre compte a été créé avec succès. Trouvez dès maintenant les meilleurs vétérinaires, toiletteurs, dresseurs et pet-sitters près de chez vous.</p>
    ${btn('Découvrir les professionnels', `${CLIENT_URL}/search`)}
  `)
}

function welcomePro({ name }) {
  return wrap(`
    <h2 style="color:#1a1a1a;margin:0 0 8px;">Bienvenue sur GaliPet 🐾</h2>
    <p style="color:#555;margin:0 0 24px;">Bonjour ${name},</p>
    <p style="color:#555;">Votre compte professionnel est créé. Complétez votre profil pour apparaître dans les résultats de recherche et commencer à recevoir des réservations.</p>
    <p style="color:#888;font-size:13px;">⚠️ Votre compte est en attente de vérification par notre équipe.</p>
    ${btn('Compléter mon profil', `${CLIENT_URL}/pro/settings`)}
  `)
}

module.exports = {
  bookingConfirmedOwner,
  newBookingRequestPro,
  bookingCancelledOwner,
  bookingCancelledPro,
  reminderOwner,
  reminderPro,
  newMessageNotification,
  reviewPromptOwner,
  welcomeOwner,
  welcomePro,
}
