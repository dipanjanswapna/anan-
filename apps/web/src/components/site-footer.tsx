import Link from "next/link";

const groups = [
  {
    title: "Discover",
    links: [
      { label: "All products", href: "/products" },
      { label: "Categories", href: "/categories" },
      { label: "Today’s deals", href: "/deals" },
      { label: "Explore stores", href: "/stores" },
    ],
  },
  {
    title: "Customer care",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Track an order", href: "/orders" },
      { label: "Shipping information", href: "/help#shipping" },
      { label: "Returns & refunds", href: "/help#returns" },
    ],
  },
  {
    title: "About ANAN",
    links: [
      { label: "Our promise", href: "/help#about" },
      { label: "Sell on ANAN", href: "/sell" },
      { label: "Privacy & data", href: "/help#privacy" },
      { label: "Contact us", href: "/help#contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#f0edf4] bg-white">
      <div className="container-shell grid gap-9 py-11 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] sm:py-14">
        <div>
          <Link href="/" className="inline-flex items-center gap-2" aria-label="ANAN home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">a</span>
            <span className="text-[25px] font-extrabold tracking-[-1.5px] text-[#24143f]">anan<span className="text-brand-600">.</span></span>
          </Link>
          <p className="mt-4 max-w-[280px] text-xs leading-6 text-[#8f849e]">
            A happier way to discover the things you love. Thoughtful finds, trusted sellers and honest service — all in one place.
          </p>
          <p className="mt-4 text-[11px] font-semibold text-[#6c5d80]">Made with care in Bangladesh ♡</p>
          <p className="mt-1 text-[11px] text-[#a097ad]">Cash on delivery · BDT ৳ · English / বাংলা</p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="mb-4 text-xs font-extrabold text-[#332547]">{group.title}</h2>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[11px] text-[#8f849e] transition hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[#f0edf4]">
        <div className="container-shell flex flex-col gap-2 py-5 text-[10px] text-[#a097ad] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 ANAN. All rights reserved.</span>
          <span>Bangladesh · BDT ৳ · English</span>
        </div>
      </div>
    </footer>
  );
}
