import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { contactSchema } from "../../supabase/functions/contact-message/rules";

const Contact = () => {
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [conversation, setConversation] = useState<{ subject: string; message: string; reply: string | null } | null>(null);
  const [link, setLink] = useState(() => localStorage.getItem("contact-conversation-link") ?? "");
  const [lookupError, setLookupError] = useState("");
  const id = params.get("conversation");
  const token = params.get("token");
  const checkReply = async () => {
    if (!id || !token) return;
    const { data, error } = await supabase.functions.invoke("contact-message", { body: { action: "lookup", id, token } });
    if (error || data?.error) { setLookupError("Conversation unavailable. Check your private link."); return; }
    setConversation(data); setLookupError("");
  };
  useEffect(() => { void checkReply(); }, [id, token]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = contactSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) return toast.error("Please complete all fields with a valid email address.");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("contact-message", { body: { action: "submit", ...parsed.data } });
      if (error || !data?.id || !data?.token) throw new Error("Could not send your message. Please try again.");
      const nextLink = `${window.location.origin}/contact?conversation=${encodeURIComponent(data.id)}&token=${encodeURIComponent(data.token)}`;
      setLink(nextLink); localStorage.setItem("contact-conversation-link", nextLink);
      form.reset(); toast.success("Message delivered to the admins.");
    } catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-center mb-8">Contact Us</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Get in touch with us. We're here to help with any questions you may have.
            </p>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
                {lookupError && <p role="alert" className="mb-4 text-destructive">{lookupError}</p>}
                {conversation && <div className="border rounded-lg p-4 mb-6 space-y-3"><h3 className="font-semibold break-words">{conversation.subject}</h3><p className="whitespace-pre-wrap break-words">{conversation.message}</p><h4 className="font-semibold">Admin reply</h4><p className="whitespace-pre-wrap break-words">{conversation.reply ?? "Awaiting an admin reply."}</p><Button variant="outline" onClick={checkReply}>Check for Reply</Button></div>}
                {link && <div className="border rounded-lg p-4 mb-6 space-y-3"><p className="font-semibold">Your private conversation</p><p className="text-sm text-muted-foreground">Keep this link private to check the admin's reply. Replies are not sent by email.</p><a className="text-primary underline break-all" href={link}>Open your conversation</a><Button className="block" variant="outline" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Private link copied.")).catch(() => toast.error("Could not copy link."))}>Copy Private Link</Button></div>}
                <form className="space-y-6" onSubmit={submit}>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required maxLength={100} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" required maxLength={255} type="email" placeholder="john@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" required maxLength={200} placeholder="What is this about?" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" required maxLength={5000} placeholder="Your message here..." rows={6} />
                  </div>
                  <Button size="lg" className="w-full" type="submit" disabled={busy}>
                    {busy ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Address</h3>
                        <p className="text-muted-foreground">
                          Entoto Mountain Road<br />
                          Addis Ababa, Ethiopia<br />
                          P.O. Box 12345
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <p className="text-muted-foreground">
                          +251 11 123 4567<br />
                          +251 11 765 4321
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-muted-foreground">
                          info@entotopolytechnic.edu.et<br />
                          admissions@entotopolytechnic.edu.et
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
