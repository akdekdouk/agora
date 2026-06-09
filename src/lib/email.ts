import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewOfferNotification({
  to,
  consumerName,
  merchantName,
  offerTitle,
  discount,
  validTo,
  offerUrl,
}: {
  to: string;
  consumerName?: string | null;
  merchantName: string;
  offerTitle: string;
  discount: number;
  validTo: Date;
  offerUrl: string;
}) {
  const validUntil = new Date(validTo).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await resend.emails.send({
    from: "Agora <notifications@agora-deals.com>",
    to,
    subject: `🎉 ${merchantName} a publié une nouvelle promo : ${discount}% de réduction`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; font-size: 28px; margin: 0;">Agora</h1>
          <p style="color: #fed7aa; margin: 8px 0 0;">Nouvelles promotions locales</p>
        </div>

        <p style="color: #374151; font-size: 16px;">Bonjour ${consumerName ?? ""}👋</p>

        <p style="color: #374151; font-size: 16px;">
          <strong>${merchantName}</strong> que vous suivez vient de publier une nouvelle promotion :
        </p>

        <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <div style="background: #f97316; color: white; font-size: 32px; font-weight: bold; border-radius: 50px; display: inline-block; padding: 8px 24px; margin-bottom: 12px;">
            -${discount}%
          </div>
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 8px;">${offerTitle}</h2>
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">Valable jusqu'au ${validUntil}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${offerUrl}" style="background: #f97316; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Voir la promotion
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Vous recevez cet email car vous suivez ${merchantName} sur Agora.<br/>
          <a href="${offerUrl}" style="color: #f97316;">Se désabonner</a>
        </p>
      </div>
    `,
  });
}
