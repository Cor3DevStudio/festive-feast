import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-foreground text-background py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h1 className="font-display text-4xl font-semibold">About Christmas Decors PH</h1>
          <p className="mt-5 text-lg text-background/70 leading-relaxed">
            We celebrate Filipino Christmas traditions by crafting and sharing beautiful Parol
            and holiday decorations with homes and businesses around the world.
          </p>
        </div>
      </section>

      {/* History */}
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <h2 className="font-display text-2xl font-semibold text-foreground">History</h2>
        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
          <h3 className="font-semibold text-foreground">Founding Story</h3>
          <p>
            Christmas Decors PH was born from a passion for traditional Filipino Christmas
            decorations and a vision to share their beauty with the world. In September 2018,
            founder Donald Mark Wood was working as a craftsman in a family Christmas decorating
            business when he noticed a clear gap: there were very limited options for buying
            traditional Parol online. Seeing the opportunity, he began a new entrepreneurial
            journey.
          </p>
          <p>
            With a dream to make Filipino Parol accessible to a global audience, Donald created an
            online presence for Christmas Decors PH through Facebook. Over time, the page grew into
            a dedicated community of around 7,000 followers who share the same enthusiasm for these
            meaningful decorations.
          </p>
          <p>
            Donald was not alone in building the company. He was joined by Mr. Christian Jay "CJ"
            Cay, a former colleague in Christmas decor crafting, whose support, skill, and shared
            vision strengthened the foundation of the business.
          </p>
          <h3 className="pt-2 font-semibold text-foreground">The First Customer</h3>
          <p>
            Christmas Decors PH's first major milestone came with its inaugural customer, Mrs.
            Thilman from Japan. She ordered six sets of Size 10 Capiz Ball Parol for her resort.
            It was the company's first transaction and a defining challenge.
          </p>
          <p>
            Through the hard work and dedication of the Christmas Decors PH Production Team, the
            project was completed successfully. Mrs. Thilman was delighted with the lanterns and
            gave glowing feedback, validating the quality and commitment of the team.
          </p>
          <p>
            That first project ignited a deeper sense of purpose. Christmas Decors PH saw the
            impact of its creations not only for fellow kababayan, but for people worldwide. The
            Parol's radiant light became a symbol of hope and joy that the company remains
            committed to sharing.
          </p>
          <p>
            Today, Christmas Decors PH continues to grow and thrive, bringing the warmth and beauty
            of Filipino Christmas traditions to homes, resorts, and businesses across the globe.
            Built on craftsmanship, dedication, and heartfelt mission, the company looks forward to
            illuminating the world with the spirit of Christmas for years to come.
          </p>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-6 max-w-4xl grid md:grid-cols-2 gap-6">
          <article className="rounded-xl bg-card border border-border p-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">Mission</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              At Christmas Decors PH, our mission is to spread the spirit of Christmas and
              celebrate Filipino culture through the creation and distribution of exquisite Parol
              and holiday decorations. We are committed to crafting high-quality, handcrafted
              products that bring joy, light, and warmth to homes and businesses worldwide. Our
              mission is to share the magic of the Filipino Christmas tradition with the world and
              bring Filipino culture to everyone's home.
            </p>
          </article>
          <article className="rounded-xl bg-card border border-border p-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">Vision</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Our vision at Christmas Decors PH is to become the global leader in Filipino
              Christmas decor, renowned for craftsmanship, creativity, and commitment to cultural
              heritage. We aspire to connect people across borders and cultures, fostering unity
              and shared celebration through meaningful creations. We envision a world where the
              radiance of our lanterns illuminates hearts and homes, promoting love, hope, and
              togetherness that define the Christmas season.
            </p>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Bring Filipino Christmas to your space
        </h2>
        <p className="mt-3 text-muted-foreground">
          Explore handcrafted Parol and holiday decor made with heart and tradition.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/shop"
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Shop now
          </Link>
          <Link
            to="/contact"
            className="rounded-md border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Contact us
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
