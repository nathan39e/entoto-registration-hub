import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Phone } from "lucide-react";

const Payment = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [txId, setTxId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentAmount = 1500; // ETB

  const handleTelebirrPayment = async () => {
    if (!/^0[79][0-9]{8}$/.test(phoneNumber)) return toast.error("Please enter a valid phone number (09XXXXXXXX)");
    const tx = txId.trim();
    if (!/^[A-Za-z0-9]{6,30}$/.test(tx)) return toast.error("Please enter the Telebirr transaction ID from your SMS");
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { error } = await supabase.from("payments").insert({
        user_id: user.id, amount: paymentAmount, transaction_id: tx, payment_method: "telebirr",
      });
      if (error) throw error;
      toast.success("Payment submitted! An admin will verify it shortly.");
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
                    <CardTitle>Pay with Telebirr</CardTitle>
                    <CardDescription>Secure mobile payment</CardDescription>
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

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Payment Instructions:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Enter your Telebirr phone number</li>
                    <li>Click "Pay with Telebirr" button</li>
                    <li>Check your phone for Telebirr payment notification</li>
                    <li>Enter your PIN to complete the payment</li>
                    <li>You will be redirected after successful payment</li>
                  </ol>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleTelebirrPayment}
                  disabled={isProcessing}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isProcessing ? "Processing..." : `Pay ${paymentAmount} ETB with Telebirr`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By clicking "Pay with Telebirr", you agree to our terms and conditions
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
