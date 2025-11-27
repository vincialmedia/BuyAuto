import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SubscribeRequestBody {
  email: string;
  consent: boolean;
}

interface SuccessResponse {
  success: true;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ResponseData = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { email, consent } = req.body as SubscribeRequestBody;

    // Validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "E-Mail-Adresse ist erforderlich",
      });
    }

    if (!consent) {
      return res.status(400).json({
        success: false,
        error: "Bitte bestätigen Sie, dass Sie E-Mails erhalten möchten",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      });
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return res.status(500).json({
        success: false,
        error: "Newsletter-Service ist nicht konfiguriert",
      });
    }

    // Add contact to Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (!audienceId) {
      console.error("RESEND_AUDIENCE_ID is not configured");
      return res.status(500).json({
        success: false,
        error: "Newsletter-Service ist nicht konfiguriert",
      });
    }

    const signUpDate = new Date().toISOString();

    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId,
    });

    return res.status(200).json({
      success: true,
      message: "Erfolgreich angemeldet! Vielen Dank für Ihre Anmeldung.",
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);

    // Handle duplicate email
    if (error?.message?.includes("already exists") || error?.statusCode === 400) {
      return res.status(400).json({
        success: false,
        error: "Diese E-Mail-Adresse ist bereits registriert",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    });
  }
}
