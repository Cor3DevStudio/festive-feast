import { motion } from "framer-motion";
import { Sparkles, Lightbulb, Gift } from "lucide-react";

const cards = [
  {
    icon: Sparkles,
    title: "Handcrafted Parols",
    description:
      "Each parol is lovingly handcrafted by skilled artisans from Pampanga, using traditional techniques passed down through generations. Genuine capiz shells and bamboo frames ensure every lantern is a unique work of art.",
  },
  {
    icon: Lightbulb,
    title: "Festive Lights & Decor",
    description:
      "From warm white fairy lights to classic multicolor rice lights, we carry everything you need to make your home sparkle this holiday season. Energy-efficient LEDs that last all season long.",
  },
  {
    icon: Gift,
    title: "One Stop for the Season",
    description:
      "Parols, lights, wreaths, nativity sets, and tree toppers — find everything under one roof. We make it easy to create the perfect Filipino Christmas atmosphere in your home.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
            Why shop with us?
          </h2>
          <p className="mt-4 text-muted-foreground" style={{ textWrap: "pretty" as any }}>
            We're a family-run business from Quezon City, passionate about preserving the tradition of Filipino Christmas decor. Every product we offer is selected for its quality, beauty, and authenticity.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              className="rounded-lg bg-card p-8 shadow-card"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.2, 0, 0, 1] }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
