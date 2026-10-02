import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Payment = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [txId, setTxId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const paymentAmount = 1500; // ETB

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("payments").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setSubmitted(data?.status === "pending" || data?.status === "completed");
    });
  }, []);

  const handleTelebirrPayment = async () => {
    if (!/^0[79][0-9]{8}$/.test(phoneNumber)) return toast.error("Please enter a valid phone number (09XXXXXXXX)");
    const tx = txId.trim();
    if (!/^[A-Za-z0-9]{6,30}$/.test(tx)) return toast.error("Please enter the Telebirr transaction ID from your SMS");
    if (!receipt || !receipt.type.startsWith("image/") || receipt.size > 5 * 1024 * 1024) return toast.error("Please upload a photo/screenshot of your receipt (image under 5MB).");
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: prior } = await supabase.from("payments").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (prior?.status === "pending" || prior?.status === "completed") { setSubmitted(true); toast.info("Your receipt has already been submitted."); return; }
      const ext = receipt.name.split(".").pop() || "jpg";
      const receipt_path = `${user.id}/receipt-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("result-docs").upload(receipt_path, receipt, { contentType: receipt.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("payments").insert({
        user_id: user.id, receipt_path, amount: paymentAmount, transaction_id: tx, payment_method: "telebirr",
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Receipt submitted! An admin will verify it shortly.");
      setTimeout(() => navigate("/student-dashboard"), 1200);
    } catch {
      toast.error("Could not submit payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">Payment</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Complete your registration by making the payment
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-2xl">
            {/* Payment Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Registration and examination fees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">Registration Fee</span>
                    <span className="font-semibold">{paymentAmount} ETB</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">Examination Fee</span>
                    <span className="font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-2">
                    <span>Total Amount</span>
                    <span className="text-primary">{paymentAmount} ETB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Telebirr Payment */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Payment Receipt Verification</CardTitle>
                    <CardDescription>Upload the receipt of the payment you made</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telebirr Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={10}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your Telebirr registered phone number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tx">Telebirr Transaction ID</Label>
                  <Input id="tx" placeholder="e.g., CHK12AB34CD" value={txId} maxLength={30}
                    onChange={(e) => setTxId(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt Photo *</Label>
                  <Input id="receipt" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
                  <p className="text-sm text-muted-foreground">A clear photo or screenshot of the Telebirr / bank receipt (under 5MB).</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Payment Instructions:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Send {paymentAmount} ETB to the college's Telebirr account</li>
                    <li>Copy the transaction ID from the Telebirr SMS</li>
                    <li>Enter your phone number, the transaction ID and upload the receipt photo</li>
                    <li>An admin checks the receipt and verifies your payment</li>
                    <li>Download your registration slip from your dashboard once approved</li>
                  </ol>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleTelebirrPayment}
                   disabled={isProcessing || submitted}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                   {isProcessing ? "Submitting..." : submitted ? "Receipt awaiting review" : "Submit Receipt"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => navigate("/student-dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
