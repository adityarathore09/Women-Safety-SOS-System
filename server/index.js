import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import twilio from "twilio";
import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.post("/api/sos", async (req, res) => {
  const { location, message, contacts } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "No emergency contacts provided" });
  }

  const results = {
    sms: [],
    email: [],
    errors: [],
  };

  // Twilio Setup
  const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

  const locationUrl = location 
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : "Location not available";

  const fullMessage = `${message || "EMERGENCY SOS ALERT!"}\nMy Location: ${locationUrl}`;

  // EmailJS Setup
  const emailjsConfig = {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  };

  const canSendEmail = emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey && emailjsConfig.privateKey;

  for (const contact of contacts) {
    // Send SMS via Twilio
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      let formattedPhone = contact.phone.trim();
      // Basic check: if it doesn't start with '+', it might be missing a country code
      if (!formattedPhone.startsWith('+')) {
        // We can't be 100% sure of the country, but we can warn the user
        console.log(`Warning: Phone number ${formattedPhone} might be missing a country code.`);
      }

      try {
        await twilioClient.messages.create({
          body: fullMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        results.sms.push(formattedPhone);
      } catch (err) {
        console.error(`Twilio Error for ${formattedPhone}:`, err);
        results.errors.push(`SMS to ${formattedPhone} failed: ${err.message || "Unknown error"}`);
      }
    }

    // Send Email via EmailJS
    if (canSendEmail) {
      try {
        await emailjs.send(
          emailjsConfig.serviceId,
          emailjsConfig.templateId,
          {
            to_name: contact.name,
            to_email: contact.email,
            message: fullMessage,
            location_url: locationUrl,
          },
          {
            publicKey: emailjsConfig.publicKey,
            privateKey: emailjsConfig.privateKey,
          }
        );
        results.email.push(contact.email);
      } catch (err) {
        console.error(`EmailJS Error for ${contact.email}:`, err);
        // EmailJS errors sometimes have a 'text' property instead of 'message'
        const errorMsg = err.message || err.text || "Unknown email error";
        results.errors.push(`Email to ${contact.email} failed: ${errorMsg}`);
      }
    }
  }

  const warnings = [];
  if (!twilioClient) warnings.push("Twilio SID/Token missing");
  if (!process.env.TWILIO_PHONE_NUMBER) warnings.push("Twilio Phone Number missing");
  if (!canSendEmail) warnings.push("EmailJS credentials missing");

  res.json({
    success: results.sms.length > 0 || results.email.length > 0,
    results,
    warning: warnings.length > 0 ? warnings.join(". ") : null
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
      app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});
startServer().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
