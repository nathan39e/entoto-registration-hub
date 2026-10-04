import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import iso from "@/assets/iso-21001.png";

export interface IDCardData {
  name: string;
  code: string;
  department: string;
  field?: string | null;
  program?: string | null;
  photoPath?: string | null;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  issuedAt?: string;
}

// Print-only artifact: fixed brand colors are inlined so the card prints identically in a standalone window.
const BLUE = "#1e3a8a";
const card: React.CSSProperties = {
  width: "85.6mm", height: "54mm", borderRadius: "3mm", overflow: "hidden", background: "#fff",
  border: `0.3mm solid ${BLUE}`, fontFamily: "Arial, sans-serif", color: "#111", position: "relative", boxSizing: "border-box",
};
const band: React.CSSProperties = { background: BLUE, color: "#fff", display: "flex", alignItems: "center", gap: "2mm", padding: "1.5mm 2.5mm" };

const StudentIDCard = ({ data }: { data: IDCardData }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const year = new Date(data.issuedAt ?? Date.now()).getFullYear();

  useEffect(() => {
    if (!data.photoPath) return;
    supabase.storage.from("result-docs").createSignedUrl(data.photoPath, 3600).then(({ data: s }) => setPhoto(s?.signedUrl ?? null));
  }, [data.photoPath]);

  const print = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w || !ref.current) return;
    w.document.write(`<html><head><title>ID Card - ${data.code}</title><style>@page{size:auto;margin:10mm}body{margin:0;display:flex;flex-direction:column;gap:8mm;align-items:center;padding:8mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${ref.current.innerHTML}</body></html>`);
    w.document.close();
    const imgs = Array.from(w.document.images);
    Promise.all(imgs.map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))
      .then(() => { w.focus(); w.print(); });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Student ID Card</CardTitle>
          <CardDescription>Front and back, standard card size. Print and laminate.</CardDescription>
        </div>
        <Button onClick={print}><Printer className="h-4 w-4 mr-2" />Print ID Card</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div ref={ref} className="flex flex-wrap gap-6 justify-center" data-no-translate>
          {/* Front */}
          <div style={card}>
            <div style={band}>
              <img src={logo} alt="" style={{ width: "8mm", height: "8mm", objectFit: "contain", background: "#fff", borderRadius: "50%" }} />
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: "2.6mm", fontWeight: 700 }}>TEFERI MEKONNEN POLYTECHNIC COLLEGE</div>
                <div style={{ fontSize: "2mm", opacity: 0.9 }}>STUDENT IDENTIFICATION CARD</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2.5mm", padding: "2mm 2.5mm" }}>
              <div style={{ width: "20mm", height: "25mm", border: `0.3mm solid ${BLUE}`, borderRadius: "1mm", overflow: "hidden", background: "#eef2ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2mm", color: "#666" }}>
                {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "PHOTO"}
              </div>
              <div style={{ fontSize: "2.3mm", lineHeight: 1.35, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "3mm", fontWeight: 700, color: BLUE }}>{data.name}</div>
                <div><b>ID:</b> {data.code}</div>
                <div><b>Dept:</b> {data.department}</div>
                {data.field && <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b>Field:</b> {data.field}</div>}
                <div><b>Program:</b> {data.program ?? "Regular"}</div>
                <div><b>Year:</b> {year} G.C.</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}><QRCodeSVG value={`TMPC:${data.code}`} size={56} /></div>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5mm", background: BLUE }} />
          </div>
          {/* Back */}
          <div style={card}>
            <div style={{ padding: "2.5mm 3mm", fontSize: "2.2mm", lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, color: BLUE, fontSize: "2.6mm" }}>In case of emergency contact</div>
              <div><b>Name:</b> {data.emergencyName || "-"} {data.emergencyRelation ? `(${data.emergencyRelation})` : ""}</div>
              <div><b>Phone:</b> {data.emergencyPhone || "-"}</div>
              <div style={{ marginTop: "1.5mm" }}>This card is the property of Teferi Mekonnen Polytechnic College. It must be carried on campus and returned on request. If found, please return to the college or call +251 945 753 837.</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2mm" }}>
                <div>
                  <div style={{ borderTop: "0.2mm solid #111", width: "28mm", paddingTop: "0.5mm" }}>Registrar signature</div>
                  <div style={{ marginTop: "1mm" }}>Issued: {new Date(data.issuedAt ?? Date.now()).toLocaleDateString()}</div>
                </div>
                <img src={iso} alt="ISO 21001" style={{ height: "11mm" }} />
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5mm", background: BLUE }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentIDCard;
