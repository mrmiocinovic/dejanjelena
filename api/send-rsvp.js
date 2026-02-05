import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

if (process.env.VERCEL_ENV !== "production") {
  dotenv.config();
}

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  console.log("BODY:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, attendance, guests, message, website } = req.body;

  // Honeypot check
  if (website) return res.status(200).json({ success: true });

  // VALIDATION
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({ error: "Neispravno ime" });
  }

  const normalizedAttendance = attendance?.toLowerCase().trim();
  if (!["da", "ne"].includes(normalizedAttendance)) {
    return res.status(400).json({ error: "Neispravan odgovor" });
  }

  const guestsNumber = guests ? Number(guests) : 0;
  if (guestsNumber > 10) {
    return res.status(400).json({ error: "Previše gostiju" });
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString("sr-RS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const row = [
    name.trim(),
    normalizedAttendance,
    guestsNumber,
    message || "-",
    formattedDate,
  ];

  try {
    // Append to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    // Send email
    await transporter.sendMail({
      from: `"Potvrda sa sajta – Dejan & Jelena" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      cc: "gavrilovic0511@gmail.com",
      subject: "Nova Potvrda 💍",
      html: `
        <h2>Nova Potvrda</h2>
        <p><strong>Ime:</strong> ${name.trim()}</p>
        <p><strong>Dolazi:</strong> ${normalizedAttendance}</p>
        <p><strong>Broj gostiju:</strong> ${guestsNumber || "-"}</p>
        <p><strong>Poruka:</strong> ${message || "-"}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("RSVP ERROR:", err);
    return res
      .status(500)
      .json({ error: "Greška pri slanju mejla ili upisu u Sheet" });
  }
}
