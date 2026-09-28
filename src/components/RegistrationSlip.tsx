import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import logo from "@/assets/logo.png";

interface Props { name: string; code: string; department: string; amount: number; approvedAt?: string }

const RegistrationSlip = ({ name, code, department, amount, approvedAt }: Props) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const qr = qrRef.current?.querySelector("canvas");
    const c = document.createElement("canvas");
    c.width = 800; c.height = 500;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 800, 500);
    ctx.fillStyle = "#1e40af"; ctx.fillRect(0, 0, 800, 80);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 26px sans-serif";
    ctx.fillText("Teferi Mekonnen Polytechnic College", 30, 50);
    ctx.fillStyle = "#111827"; ctx.font = "bold 22px sans-serif";
    ctx.fillText("Registration Slip", 30, 130);
    ctx.font = "18px sans-serif";
    const lines = [
      `Name: ${name}`, `Student Code: ${code}`, `Department: ${department}`,
      `Payment: ${amount} ETB (verified)`, `Approved: ${approvedAt ? new Date(approvedAt).toLocaleDateString() : new Date().toLocaleDateString()}`,
    ];
    lines.forEach((l, i) => ctx.fillText(l, 30, 180 + i * 40));
    if (qr) ctx.drawImage(qr, 540, 140, 220, 220);
    ctx.font = "14px sans-serif"; ctx.fillStyle = "#6b7280";
    ctx.fillText("Present this slip with your ID at the registrar's office.", 30, 460);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png"); a.download = `registration-slip-${code}.png`; a.click();
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Registration Slip</CardTitle>
        <CardDescription>Your application and payment are approved. Download your slip.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        <div ref={qrRef} className="bg-background p-2 rounded border">
          <QRCodeCanvas value={`TMPC:${code}`} size={160} />
        </div>
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <img src={logo} alt="" className="h-10 mx-auto sm:mx-0 mb-2" />
          <p className="font-semibold">{name}</p>
          <p className="text-primary font-bold text-lg">{code}</p>
          <p className="text-sm text-muted-foreground">Department: {department}</p>
          <Button className="mt-3" onClick={download}><Download className="mr-2 h-4 w-4" />Download Slip</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationSlip;
