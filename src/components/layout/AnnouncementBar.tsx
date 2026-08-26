import { formatPaise } from "@/lib/storefront/money";

function readConfiguredPaise(name: string): number | null {
  const raw = process.env[name]?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function AnnouncementBar() {
  const threshold = readConfiguredPaise("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE");
  const messages = [
    threshold !== null ? `Free shipping above ${formatPaise(threshold)}` : null,
    "Guest checkout",
    "Prices shown in INR",
  ].filter((message): message is string => Boolean(message));

  return (
    <aside aria-label="Store information" className="bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-8 max-w-[1400px] items-center justify-center gap-5 overflow-x-auto px-4 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] sm:justify-between sm:px-8 lg:px-12">
        {messages.map((message) => (
          <span className="shrink-0" key={message}>
            {message}
          </span>
        ))}
      </div>
    </aside>
  );
}
