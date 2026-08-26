import { BadgeIndianRupee, MapPinCheck, ShieldCheck } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Secure payment", text: "Payment entry stays on Razorpay checkout." },
  { icon: MapPinCheck, title: "Guest tracking", text: "Track an order without creating an account." },
  { icon: BadgeIndianRupee, title: "Clear INR pricing", text: "Approved retail prices are always shown in rupees." },
];

export function TrustStrip() {
  return (
    <section aria-label="Shopping assurances" className="border-y border-line">
      <div className="mx-auto grid max-w-[1400px] md:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div className="flex gap-4 border-b border-line px-5 py-7 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:last:border-r-0 lg:px-12" key={title}>
            <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-accent-ink" size={23} strokeWidth={1.6} />
            <div>
              <h2 className="text-sm font-bold">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-ink-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
