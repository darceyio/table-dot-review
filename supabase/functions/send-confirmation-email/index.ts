import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationRequest {
  email: string;
  confirmationUrl: string;
  displayName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, displayName }: ConfirmationRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Table.Review <invitations@table.review>",
      to: [email],
      subject: "Confirm your Table.Review account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background-color: #f9fafb;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
                padding: 40px 32px;
                text-align: center;
              }
              .header h1 {
                color: white;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
              }
              .content {
                padding: 40px 32px;
              }
              .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 16px;
              }
              .message {
                font-size: 16px;
                color: #4b5563;
                margin-bottom: 32px;
              }
              .button-container {
                text-align: center;
                margin: 32px 0;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
                color: white;
                text-decoration: none;
                padding: 16px 48px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
              }
              .footer {
                padding: 24px 32px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 14px;
                color: #6b7280;
              }
              .divider {
                margin: 32px 0;
                border: 0;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Welcome to Table.Review</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${displayName || "there"}! 👋</p>
                <p class="message">
                  Thanks for joining Table.Review! We're excited to have you on board.
                  To complete your registration and start receiving tips and reviews, please confirm your email address.
                </p>
                <div class="button-container">
                  <a href="${confirmationUrl}" class="button">
                    Confirm Email Address
                  </a>
                </div>
                <hr class="divider" />
                <p class="message" style="font-size: 14px; color: #6b7280;">
                  If you didn't create this account, you can safely ignore this email.
                </p>
                <p class="message" style="font-size: 14px; color: #6b7280;">
                  If the button above doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${confirmationUrl}" style="color: #0ea5e9; word-break: break-all;">${confirmationUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p style="margin: 0;">
                  Table.Review – Revolutionizing hospitality feedback
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
