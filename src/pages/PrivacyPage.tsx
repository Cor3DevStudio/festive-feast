import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LAST_UPDATED = "March 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-foreground text-background py-14">
        <div className="container mx-auto px-6 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-2 text-background/60 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-14 max-w-2xl">
        <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1">
          <p>
            Christmas Decors PH ("we", "us", or "our") is committed to protecting your personal
            information in accordance with the <strong>Data Privacy Act of 2012 (Republic Act 10173)</strong> of
            the Philippines. This Privacy Policy explains how we collect, use, store, and protect
            your information when you visit our website or place an order.
          </p>

          <h2>1. Information we collect</h2>
          <p>When you create an account or place an order, we collect:</p>
          <ul>
            <li>Full name and contact details (email address, phone number)</li>
            <li>Shipping and billing address</li>
            <li>Order and payment history (we do not store full card numbers)</li>
            <li>Account credentials (email and hashed password managed by Supabase Auth)</li>
          </ul>
          <p>
            When you browse our website, we may automatically collect device and usage data
            (IP address, browser type, pages visited) through standard server logs.
          </p>

          <h2>2. How we use your information</h2>
          <ul>
            <li>To process and fulfill your orders</li>
            <li>To send order confirmations and shipping updates</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To improve our website and product offerings</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p>We do not sell, rent, or share your personal data with third parties for marketing.</p>

          <h2>3. Payment processing</h2>
          <p>
            Payments via QR Ph and other methods are processed by{" "}
            <strong>PayMongo</strong> (https://paymongo.com), a BSP-registered payment gateway.
            We transmit only the minimum required information (name, email, amount) to PayMongo.
            Card details are handled entirely by PayMongo and are never stored on our servers.
          </p>

          <h2>4. Data storage and security</h2>
          <p>
            Your data is stored in Supabase (a cloud database service with servers in secured
            data centers). We implement Row-Level Security (RLS) policies so that you can only
            access your own account and order information. We use HTTPS for all data transmission.
          </p>
          <p>
            While we take reasonable measures to protect your data, no system is 100% secure.
            Please use a strong, unique password for your account.
          </p>

          <h2>5. Cookies</h2>
          <p>
            We use essential cookies and local storage to maintain your login session and cart.
            We do not use third-party tracking or advertising cookies.
          </p>

          <h2>6. Your rights</h2>
          <p>Under the Data Privacy Act of 2012, you have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Object to or restrict processing of your data</li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a href="mailto:info@christmasdecors.ph" className="text-primary underline">
              info@christmasdecors.ph
            </a>.
          </p>

          <h2>7. Retention</h2>
          <p>
            We retain order records for at least five (5) years as required by Philippine tax and
            commercial laws. Account data may be deleted upon written request, subject to legal
            retention requirements.
          </p>

          <h2>8. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be posted
            on this page with a new "last updated" date.
          </p>

          <h2>9. Contact</h2>
          <p>
            For privacy-related concerns, reach us at:{" "}
            <a href="mailto:info@christmasdecors.ph" className="text-primary underline">
              info@christmasdecors.ph
            </a>
            <br />
            Christmas Decors PH, Quezon City, Metro Manila, Philippines.
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-primary underline">Terms of Service</Link>
          <Link to="/contact" className="text-primary underline">Contact us</Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
