import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type OrderSuccessState = {
  paymentMethod?: string;
  /** QR Ph: PayMongo reported payment succeeded (poll or webhook). */
  paymentConfirmed?: boolean;
};

function successCopy(state: OrderSuccessState): { title: string; detail: string } {
  const { paymentMethod: m, paymentConfirmed } = state;

  if (paymentConfirmed && m === "qrph") {
    return {
      title: "Payment received!",
      detail:
        "PayMongo confirmed your QR Ph payment. We'll email you about shipping. Maligayang Pasko!",
    };
  }
  if (m === "cod") {
    return {
      title: "Thank you for your order!",
      detail:
        "Pay in cash when your order arrives. We'll email updates about shipping. Maligayang Pasko!",
    };
  }
  if (m === "bank") {
    return {
      title: "Thank you for your order!",
      detail:
        "We'll send our bank transfer details to your email shortly. Maligayang Pasko!",
    };
  }
  if (m === "paymongo") {
    return {
      title: "Thank you for your order!",
      detail:
        "If you completed payment with PayMongo, it may take a moment to confirm. We'll email you soon. Maligayang Pasko!",
    };
  }
  if (m === "qrph") {
    return {
      title: "Thank you for your order!",
      detail:
        "Your QR Ph checkout step completed. We'll confirm payment and ship your festive decor soon. Maligayang Pasko!",
    };
  }
  return {
    title: "Thank you for your order!",
    detail:
      "We've received your order and will follow up by email. Maligayang Pasko!",
  };
}

export default function OrderSuccess() {
  const location = useLocation();
  const state = (location.state ?? {}) as OrderSuccessState;
  const { title, detail } = successCopy(state);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto flex flex-col items-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="flex flex-col items-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-3 max-w-md text-muted-foreground">{detail}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue shopping
            </Link>
            <Link
              to="/"
              className="rounded-md bg-muted px-8 py-3 text-sm font-medium text-foreground"
            >
              Back to home
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
