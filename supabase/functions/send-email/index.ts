import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND_NAME = "A Boa";
const BRAND_COLOR = "#9b87f5";
const BRAND_COLOR_DARK = "#7E69AB";

function buildEmailHtml(title: string, body: string, ctaText?: string, ctaUrl?: string): string {
  const ctaBlock = ctaText && ctaUrl ? `
    <tr>
      <td align="center" style="padding: 24px 0 16px;">
        <a href="${ctaUrl}" style="
          display: inline-block;
          background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK});
          color: #ffffff;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 14px rgba(155, 135, 245, 0.4);
        ">${ctaText}</a>
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1fe; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1fe; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK}); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🎰 ${BRAND_NAME}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 22px; font-weight: 700;">${title}</h2>
              <div style="color: #4a4a68; font-size: 15px; line-height: 1.7;">
                ${body}
              </div>
            </td>
          </tr>
          <!-- CTA -->
          ${ctaBlock}
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 28px; border-top: 1px solid #ede9fe; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                Este email foi enviado automaticamente por ${BRAND_NAME}.<br>
                Se você não solicitou este email, pode ignorá-lo com segurança.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const EMAIL_TEMPLATES: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (data) => ({
    subject: `🎉 Bem-vindo(a) à ${BRAND_NAME}, ${data.name}!`,
    html: buildEmailHtml(
      `Bem-vindo(a), ${data.name}!`,
      `<p>Que bom ter você com a gente! 🎊</p>
       <p>Na <strong>${BRAND_NAME}</strong> você pode participar de sorteios incríveis, raspadinhas premiadas e muito mais.</p>
       <p>Comece agora mesmo adicionando saldo à sua carteira e concorra a prêmios todos os dias!</p>`,
      "Começar agora",
      data.site_url || "#"
    ),
  }),

  password_recovery: (data) => ({
    subject: `🔑 Redefinir sua senha - ${BRAND_NAME}`,
    html: buildEmailHtml(
      "Redefinir sua senha",
      `<p>Olá, ${data.name || ""}!</p>
       <p>Recebemos uma solicitação para redefinir a senha da sua conta na <strong>${BRAND_NAME}</strong>.</p>
       <p>Clique no botão abaixo para criar uma nova senha:</p>
       <p style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; color: #92400e; font-size: 13px;">
         ⏳ Este link expira em <strong>60 minutos</strong>. Se você não solicitou esta alteração, ignore este email.
       </p>`,
      "Redefinir senha",
      data.recovery_url || "#"
    ),
  }),

  notification: (data) => ({
    subject: `📢 ${data.title || "Nova notificação"} - ${BRAND_NAME}`,
    html: buildEmailHtml(
      data.title || "Nova notificação",
      `<p>${data.message || ""}</p>`,
      data.cta_text,
      data.cta_url
    ),
  }),

  prize_won: (data) => ({
    subject: `🏆 Parabéns! Você ganhou um prêmio! - ${BRAND_NAME}`,
    html: buildEmailHtml(
      "Você ganhou! 🎉",
      `<p>Parabéns, <strong>${data.name}</strong>!</p>
       <p>Você acabou de ganhar <strong>R$ ${data.prize_value}</strong> ${data.prize_source ? `na ${data.prize_source}` : ""}!</p>
       <p>O valor já foi creditado na sua carteira. Você pode sacar a qualquer momento via PIX.</p>`,
      "Ver minha carteira",
      data.site_url ? `${data.site_url}/carteira` : "#"
    ),
  }),

  deposit_confirmed: (data) => ({
    subject: `✅ Depósito confirmado - ${BRAND_NAME}`,
    html: buildEmailHtml(
      "Depósito confirmado!",
      `<p>Olá, <strong>${data.name}</strong>!</p>
       <p>Seu depósito de <strong>R$ ${data.amount}</strong> foi confirmado com sucesso.</p>
       <p>O saldo já está disponível na sua carteira. Divirta-se!</p>`,
      "Jogar agora",
      data.site_url || "#"
    ),
  }),
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, template, data, subject, html } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: "Campo 'to' é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);

    let emailSubject: string;
    let emailHtml: string;

    if (template && EMAIL_TEMPLATES[template]) {
      const result = EMAIL_TEMPLATES[template](data || {});
      emailSubject = result.subject;
      emailHtml = result.html;
    } else if (subject && html) {
      emailSubject = subject;
      emailHtml = html;
    } else {
      return new Response(
        JSON.stringify({ error: "Forneça 'template' válido ou 'subject' + 'html'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: "A Boa <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailHtml,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return new Response(JSON.stringify({ error: sendError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email sent successfully:", sendData);
    return new Response(JSON.stringify({ success: true, id: sendData?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
