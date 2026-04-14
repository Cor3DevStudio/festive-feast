import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LAST_UPDATED = "March 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-foreground text-background py-14">
        <div className="container mx-auto px-6 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold">Terms of Service</h1>
          <p className="mt-2 text-background/60 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-14 max-w-2xl">
        <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1">
          <p>
            By accessing or purchasing from Christmas Decors PH ("we", "us", "our"), you agree
            to be bound by these Terms of Service. Please read them carefully. These terms are
            governed by Philippine law.
          </p>

          <h2>1. Products and pricing</h2>
          <ul>
            <li>All prices are in Philippine Pesos (₱) and inclusive of applicable taxes.</li>
            <li>Product images are representative; actual colours may vary slightly due to lighting.</li>
            <li>We reserve the right to modify prices without prior notice. Orders placed before a price change are honored at the original price.</li>
            <li>We reserve the right to cancel orders for products listed with an incorrect price.</li>
          </ul>

          <h2>2. Ordering</h2>
          <ul>
            <li>You must create an account with a valid email address to place an order.</li>
            <li>An order confirmation email does not guarantee availability; we will notify you if an item becomes unavailable after you order.</li>
            <li>We reserve the right to refuse or cancel orders at our discretion (e.g., suspected fraud, pricing errors).</li>
          </ul>

          <h2>3. Payment</h2>
          <ul>
            <li><strong>QR Ph / PayMongo:</strong> Payments are processed securely by PayMongo. By using these methods you also agree to PayMongo's terms.</li>
            <li><strong>Cash on delivery (COD):</strong> Available in select areas. Please have the exact amount ready upon delivery.</li>
            <li><strong>Bank transfer:</strong> Payment must be completed within 24 hours of order placement. Unpaid orders may be cancelled.</li>
          </ul>

          <h2>4. Shipping and delivery</h2>
          <ul>
            <li>We ship nationwide via third-party couriers (LBC, J&T, or similar).</li>
            <li>Estimated delivery times are provided as a guide only and are not guaranteed.</li>
            <li>Shipping fees are calculated at checkout based on your location.</li>
            <li>Risk of loss and title for purchased items passes to you upon delivery to the carrier.</li>
            <li>We are not liable for delays caused by the courier, natural disasters, or circumstances beyond our control.</li>
          </ul>

          <h2>5. Returns and refunds</h2>
          <p>
            Under the <strong>Consumer Act of the Philippines (RA 7394)</strong>, you have the right
            to return defective or incorrectly delivered items. Please contact us within{" "}
            <strong>7 days of receiving your order</strong> if:
          </p>
          <ul>
            <li>The item arrived damaged or defective</li>
            <li>You received the wrong item</li>
            <li>The item significantly differs from its description</li>
          </ul>
          <p>
            We do not accept returns for change of mind, unless the item is in its original
            unopened packaging and you contact us within 7 days of receipt. Refunds will be
            processed within 7–14 business days via the original payment method.
          </p>
          <p>
            To initiate a return, email us at{" "}
            <a href="mailto:info@christmasdecors.ph" className="text-primary underline">
              info@christmasdecors.ph
            </a>{" "}
            with your order number and photos of the item.
          </p>

          <h2>6. Intellectual property</h2>
          <p>
            All content on this website — including images, text, logos, and design — is owned
            by Christmas Decors PH or its licensors. You may not reproduce, distribute, or create
            derivative works without our written permission.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by Philippine law, Christmas Decors PH shall not be
            liable for any indirect, incidental, or consequential damages arising from the use of
            our website or products. Our total liability for any claim shall not exceed the amount
            you paid for the order giving rise to the claim.
          </p>

          <h2>8. Changes to these terms</h2>
          <p>
            We may update these Terms of Service at any time. Continued use of our website after
            changes are posted constitutes your acceptance of the updated terms.
          </p>

          <h2>9. Governing law</h2>
          <p>
            These terms are governed by the laws of the Republic of the Philippines. Any disputes
            shall be resolved in the courts of Quezon City, Metro Manila.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these terms?{" "}
            <Link to="/contact" className="text-primary underline">Contact us</Link> or email{" "}
            <a href="mailto:info@christmasdecors.ph" className="text-primary underline">
              info@christmasdecors.ph
            </a>.
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
          <Link to="/contact" className="text-primary underline">Contact us</Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
