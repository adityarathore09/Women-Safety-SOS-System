import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import twilio from "twilio";
import emailjs from "@emailjs/nodejs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.post("/api/sos", async (req, res) => {
  const { location, message, contacts } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "No emergency contacts provided" });
  }

  const results = {
    sms: [] as string[],
    email: [] as string[],
    errors: [] as string[],
  };

  // Twilio Setup
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  const hasTwilioCreds = !!(accountSid && authToken && twilioPhone);
  const twilioClient = hasTwilioCreds
    ? twilio(accountSid, authToken)
    : null;

  if (!hasTwilioCreds) {
    console.warn("Twilio credentials missing or incomplete. SMS alerts will be skipped.");
  }

  const locationUrl = location 
    ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : "Location unavailable";

  const fullMessage = `${message || "EMERGENCY SOS!"}\nLocation: ${locationUrl}`;

  // EmailJS Setup
  const emailjsConfig = {
    serviceId: process.env.EMAILJS_SERVICE_ID?.trim(),
    templateId: process.env.EMAILJS_TEMPLATE_ID?.trim(),
    publicKey: process.env.EMAILJS_PUBLIC_KEY?.trim(),
    privateKey: process.env.EMAILJS_PRIVATE_KEY?.trim(),
  };

  const canSendEmail = !!(emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey && emailjsConfig.privateKey);

  if (!canSendEmail) {
    console.warn("EmailJS credentials missing or incomplete. Email alerts will be skipped.");
  }

  for (const contact of contacts) {
    // Send SMS via Twilio
    if (twilioClient && twilioPhone) {
      let formattedPhone = contact.phone.trim().replace(/\s+/g, '');
      // Basic check: if it doesn't start with '+', it might be missing a country code
      if (!formattedPhone.startsWith('+')) {
        console.log(`Warning: Phone number ${formattedPhone} might be missing a country code.`);
      }

      try {
        await twilioClient.messages.create({
          body: fullMessage,
          from: twilioPhone.replace(/\s+/g, ''),
          to: formattedPhone,
        });
        results.sms.push(formattedPhone);
      } catch (err: any) {
        console.error(`Twilio Error for ${formattedPhone}:`, err);
        let errorMsg = err.message || "Unknown error";
        if (err.code === 20003) {
          errorMsg = "Authentication failed. Please check your Twilio Account SID and Auth Token in the Settings menu.";
        }
        results.errors.push(`SMS to ${formattedPhone} failed: ${errorMsg}`);
      }
    }

    // Send Email via EmailJS
    if (canSendEmail) {
      try {
        await emailjs.send(
          emailjsConfig.serviceId!,
          emailjsConfig.templateId!,
          {
            to_name: contact.name,
            to_email: contact.email,
            message: fullMessage,
            location_url: locationUrl,
          },
          {
            publicKey: emailjsConfig.publicKey!,
            privateKey: emailjsConfig.privateKey!,
          }
        );
        results.email.push(contact.email);
      } catch (err: any) {
        console.error(`EmailJS Error for ${contact.email}:`, err);
        // EmailJS errors sometimes have a 'text' property instead of 'message'
        let errorMsg = err.message || err.text || "Unknown email error";
        if (errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("Authenticate")) {
          errorMsg = "Authentication failed. Please check your EmailJS Public/Private keys and Service/Template IDs in the Settings menu.";
        }
        results.errors.push(`Email to ${contact.email} failed: ${errorMsg}`);
      }
    }
  }

  const warnings = [];
  if (!accountSid || !authToken) warnings.push("Twilio SID/Token missing");
  if (!twilioPhone) warnings.push("Twilio Phone Number missing");
  if (!canSendEmail) warnings.push("EmailJS credentials missing");

  res.json({
    success: results.sms.length > 0 || results.email.length > 0,
    results,
    warning: warnings.length > 0 ? warnings.join(". ") : null
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    emailjs: !!(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY),
    gemini: !!process.env.GEMINI_API_KEY
  });
});

app.post("/api/test-sms", async (req, res) => {
  const { phone } = req.body;
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !twilioPhone) {
    return res.status(400).json({ error: "Twilio credentials missing in environment variables." });
  }

  const client = twilio(accountSid, authToken);
  
  try {
    const message = await client.messages.create({
      body: "SafeGuard Test: Your Twilio configuration is working correctly!",
      from: twilioPhone.replace(/\s+/g, ''),
      to: phone.trim().replace(/\s+/g, ''),
    });
    res.json({ success: true, sid: message.sid });
  } catch (err: any) {
    console.error("Twilio Test Error:", err);
    res.status(500).json({ 
      error: err.message, 
      code: err.code,
      moreInfo: err.moreInfo 
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
