import { useState } from "react";
import { MapPin, Mail, Phone, MessageCircle, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.subject.trim()) e.subject = "Required";
    if (!form.message.trim()) e.message = "Required";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Build mailto link as a lightweight contact method (no backend needed)
    const subject = encodeURIComponent(`[Website] ${form.subject} — from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:info@christmasdecors.ph?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  const inputCls = (hasError?: boolean) =>
    `mt-1.5 w-full rounded-md bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-accent ring-offset-2${hasError ? " ring-2 ring-destructive" : ""}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-foreground text-background py-16">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold">Contact Us</h1>
          <p className="mt-4 text-background/70">
            Have a question, bulk order inquiry, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-5">Get in touch</h2>
              <div className="space-y-4">
                {[
                  {
                    icon: <MapPin className="h-5 w-5 shrink-0 text-primary" />,
                    label: "Address",
                    value: "Quezon City, Metro Manila, Philippines",
                  },
                  {
                    icon: <Mail className="h-5 w-5 shrink-0 text-primary" />,
                    label: "Email",
                    value: "info@christmasdecors.ph",
                    href: "mailto:info@christmasdecors.ph",
                  },
                  {
                    icon: <Phone className="h-5 w-5 shrink-0 text-primary" />,
                    label: "Phone / Viber",
                    value: "+63 900 000 0000",
                    href: "tel:+639000000000",
                  },
                  {
                    icon: <MessageCircle className="h-5 w-5 shrink-0 text-primary" />,
                    label: "Facebook",
                    value: "Message us on Facebook",
                    href: "#",
                  },
                ].map(({ icon, label, value, href }) => (
                  <div key={label} className="flex gap-3">
                    <div className="mt-0.5">{icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-foreground">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-muted p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Business hours</h3>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Monday – Friday</span>
                  <span>9:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM – 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="font-display text-xl font-semibold text-green-800">Message sent!</h2>
                <p className="mt-2 text-sm text-green-700">
                  Your email client should have opened. We'll reply within 1–2 business days.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-5 rounded-md bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-xl font-semibold text-foreground">Send us a message</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Your name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Juan dela Cruz"
                      className={inputCls(!!errors.name)}
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Email address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="juan@example.com"
                      className={inputCls(!!errors.email)}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Order inquiry, bulk order, product question…"
                    className={inputCls(!!errors.subject)}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Message</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us how we can help…"
                    className={`${inputCls(!!errors.message)} resize-none`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Send message
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  This will open your email client. You can also reach us directly at{" "}
                  <a href="mailto:info@christmasdecors.ph" className="underline">
                    info@christmasdecors.ph
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
