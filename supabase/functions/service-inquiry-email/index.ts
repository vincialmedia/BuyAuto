import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  try {
    const { inquiry } = await req.json()

    if (!inquiry) {
      return new Response(
        JSON.stringify({ error: "Missing inquiry data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const messageWithBreaks = inquiry.message.replace(/
/g, "<br>")
    
    const phoneSection = inquiry.phone ? `
      <div class="field">
        <span class="label">Telefon:</span>
        <div class="value"><a href="tel:${inquiry.phone}">${inquiry.phone}</a></div>
      </div>
    ` : ""
    
    const leasingCompanySection = inquiry.leasing_company ? `
      <div class="field">
        <span class="label">Leasinggesellschaft:</span>
        <div class="value">${inquiry.leasing_company}</div>
      </div>
    ` : ""

    const inquiryTypeLabel = inquiry.inquiry_type === "uebernahme_begleiten" 
      ? "🤝 Leasingübernahme begleiten" 
      : "🚀 Leasing Exit (Full Service)"

    const emailSubject = inquiry.inquiry_type === "uebernahme_begleiten"
      ? "Übernahme begleiten"
      : "Leasing Exit"

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #4b5563; display: block; margin-bottom: 5px; }
            .value { background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Neue Leasing Concierge Anfrage</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Service-Typ:</span>
                <div class="value">${inquiryTypeLabel}</div>
              </div>
              
              <div class="field">
                <span class="label">Name:</span>
                <div class="value">${inquiry.first_name} ${inquiry.last_name}</div>
              </div>
              
              <div class="field">
                <span class="label">Email:</span>
                <div class="value"><a href="mailto:${inquiry.email}">${inquiry.email}</a></div>
              </div>
              
              ${phoneSection}
              ${leasingCompanySection}
              
              <div class="field">
                <span class="label">Nachricht / Eckdaten:</span>
                <div class="value">${messageWithBreaks}</div>
              </div>
              
              <div class="footer">
                <p>Eingegangen am: ${new Date(inquiry.created_at).toLocaleString("de-CH")}</p>
                <p><strong>BuyAuto.ch</strong> | Leasing Concierge Service</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "BuyAuto Leasing Concierge <noreply@buyauto.ch>",
        to: "Hello@buyauto.ch",
        subject: `🎯 Neue Concierge Anfrage: ${emailSubject}`,
        html: adminEmailHtml
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error("Resend API error:", errorText)
      throw new Error(`Failed to send email: ${errorText}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error in service-inquiry-email function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})