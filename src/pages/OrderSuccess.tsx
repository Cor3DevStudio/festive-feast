import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function OrderSuccess() {
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
          <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">
            Thank you for your order!
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Your payment was successful. We'll send you an email confirmation and ship your festive decor soon. Maligayang Pasko!
          </p>
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
