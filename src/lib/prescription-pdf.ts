import jsPDF from "jspdf";

export interface RxMed {
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface RxPdfInput {
  id: string;
  issued_at: string;
  instructions: string | null;
  medications: RxMed[] | null;
  doctor: { id: string; full_name: string; specialty?: string; license_number?: string };
  patient: { id: string; full_name: string; phone?: string | null; city?: string | null };
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generatePrescriptionPdf(rx: RxPdfInput): Promise<void> {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header band
  doc.setFillColor(20, 70, 130);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("JammCare", 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Télémédecine rurale — Sénégal", 14, 21);
  doc.setFontSize(9);
  doc.text(`Ordonnance n° ${rx.id.slice(0, 8).toUpperCase()}`, pageW - 14, 14, { align: "right" });
  doc.text(new Date(rx.issued_at).toLocaleDateString("fr-FR", { dateStyle: "long" }), pageW - 14, 21, { align: "right" });

  doc.setTextColor(20, 20, 20);
  y = 40;

  // Doctor block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Médecin prescripteur", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Dr ${rx.doctor.full_name}`, 14, y); y += 5;
  if (rx.doctor.specialty) { doc.text(`Spécialité : ${rx.doctor.specialty}`, 14, y); y += 5; }
  if (rx.doctor.license_number) { doc.text(`N° licence : ${rx.doctor.license_number}`, 14, y); y += 5; }

  y += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Patient", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(rx.patient.full_name, 14, y); y += 5;
  if (rx.patient.phone) { doc.text(`Téléphone : ${rx.patient.phone}`, 14, y); y += 5; }
  if (rx.patient.city) { doc.text(`Ville : ${rx.patient.city}`, 14, y); y += 5; }

  y += 6;
  doc.setDrawColor(200);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  // Prescription title
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("Prescription médicale", 14, y); y += 8;

  // Medications
  doc.setFontSize(10);
  if (rx.medications && rx.medications.length > 0) {
    rx.medications.forEach((m, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${m.name ?? "Médicament"}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const details = [
        m.dosage ? `Posologie : ${m.dosage}` : null,
        m.frequency ? `Fréquence : ${m.frequency}` : null,
        m.duration ? `Durée : ${m.duration}` : null,
      ].filter(Boolean) as string[];
      details.forEach((d) => { doc.text(`   • ${d}`, 14, y); y += 5; });
      y += 2;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.text("Aucun médicament listé.", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
  }

  if (rx.instructions) {
    y += 4;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text("Recommandations :", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(rx.instructions, pageW - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5;
  }

  // Digital signature block
  const sigPayload = `${rx.id}|${rx.doctor.id}|${rx.patient.id}|${rx.issued_at}`;
  const sigHash = await sha256Hex(sigPayload);
  const sigShort = sigHash.slice(0, 32).toUpperCase().replace(/(.{4})/g, "$1 ").trim();

  const sigY = Math.max(y + 16, 240);
  doc.setDrawColor(20, 70, 130);
  doc.setLineWidth(0.4);
  doc.line(pageW - 90, sigY, pageW - 14, sigY);
  doc.setFont("helvetica", "italic"); doc.setFontSize(9);
  doc.setTextColor(20, 70, 130);
  doc.text(`Dr ${rx.doctor.full_name}`, pageW - 14, sigY + 5, { align: "right" });
  doc.setTextColor(90, 90, 90);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7);
  doc.text("Signature numérique JammCare", pageW - 14, sigY + 10, { align: "right" });
  doc.text(`SHA-256 : ${sigShort}`, pageW - 14, sigY + 14, { align: "right" });
  doc.text(`Vérifiable via l'identifiant ${rx.id}`, pageW - 14, sigY + 18, { align: "right" });

  // Footer
  doc.setFontSize(7); doc.setTextColor(120);
  doc.text(
    "Document généré par JammCare — Plateforme de télémédecine. À présenter en pharmacie.",
    pageW / 2,
    287,
    { align: "center" },
  );

  doc.save(`ordonnance-${rx.id.slice(0, 8)}.pdf`);
}
