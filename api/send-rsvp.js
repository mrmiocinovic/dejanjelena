import nodemailer from "nodemailer";
import { google } from "googleapis";

import dotenv from "dotenv";

if (process.env.VERCEL_ENV !== "production") {
  dotenv.config();
}

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, attendance, guests, message, website } = req.body;

  if (website) return res.status(200).json({ success: true });

  if (!name || !attendance)
    return res.status(400).json({ error: "Nedostaju obavezna polja" });

  if (name.length < 2 || name.length > 50)
    return res.status(400).json({ error: "Neispravno ime" });

  if (!["da", "ne"].includes(attendance))
    return res.status(400).json({ error: "Neispravan odgovor" });

  if (guests && guests > 10)
    return res.status(400).json({ error: "Previše gostiju" });

  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = now.toLocaleDateString("sr-RS", options);

  const row = [name, attendance, guests || 0, message || "-", formattedDate];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    await transporter.sendMail({
      from: `"Potvrda sa sajta – Dejan & Jelena" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      cc: "mr.miocinovic@gmail.com"
      subject: "Nova Potvrda 💍",
      html: `
        <h2>Nova Potvrda</h2>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>Dolazi:</strong> ${attendance}</p>
        <p><strong>Broj gostiju:</strong> ${guests || "-"}</p>
        <p><strong>Poruka:</strong> ${message || "-"}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Greška pri slanju mejla ili upisu u Sheet" });
  }
}
