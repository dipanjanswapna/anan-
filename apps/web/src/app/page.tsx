import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, Truck, RotateCcw, Headphones, Sparkles, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";

const categories = [
  { name: "Electronics", sub: "Gadgets & more", icon: "⌁", color: "bg-[#eee8ff]", ink: "text-[#7144c5]" },
  { name: "Fashion", sub: "Find your style", icon: "✳", color: "bg-[#ffece8]", ink: "text-[#d66b56]" },
  { name: "Beauty", sub: "A little self-love", icon: "✿", color: "bg-[#ffeaf3]", ink: "text-[#c65b8d]" },
  { name: "Home & Kitchen", sub: "Make it yours", icon: "⌂", color: "bg-[#e8f3ed]", ink: "text-[#4f9670]" },
  { name: "Grocery", sub: "Daily essentials", icon: "◉", color: "bg-[#fff2dd]", ink: "text-[#c58a36]" },
  { name: "Books", sub: "Stories & ideas", icon: "▤", color: "bg-[#e8f0ff]", ink: "text-[#5a7ec3]" }
];

const products = [
  { name: "Minimal Everyday Ceramic Mug — Set of 2", category: "Home & Kitchen", price: "৳ 690", oldPrice: "৳ 850", rating: "4.9", reviews: "128", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&q=85", badge: "Bestseller", tone: "bg-[#f2eee9]" },
  { name: "Classic Wireless Headphones", category: "Electronics", price: "৳ 2,450", oldPrice: "৳ 2,990", rating: "4.8", reviews: "86", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=85", badge: "−18%", tone: "bg-[#f1eff5]" },
  { name: "Everyday Carry Canvas Tote", category: "Fashion", price: "৳ 590", rating: "4.7", reviews: "54", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=700&q=85", tone: "bg-[#f4eee8]" },
  { name: "Daily Glow Skincare Essentials", category: "Beauty", price: "৳ 1,250", oldPrice: "৳ 1,490", rating: "4.9", reviews: "203", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=85", badge: "Loved", tone: "bg-[#f8edf0]" }
];

const trending = [
  { name: "Soft Knit Everyday Cardigan", category: "Fashion", price: "৳ 1,850", rating: "4.8", reviews: "42", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&q=85", badge: "New", tone: "bg-[#f2edf0]" },
  { name: "Sculptural Table Lamp", category: "Home & Kitchen", price: "৳ 2,100", rating: "4.9", reviews: "31", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&q=85", tone: "bg-[#f2f0eb]" },
  { name: "Studio Wireless Earbuds", category: "Electronics", price: "৳ 1,790", oldPrice: "৳ 2,200", rating: "4.7", reviews: "76", image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=700&q=85", badge: "Popular", tone: "bg-[#eeeff4]" },
  { name: "Botanical Body Care Set", category: "Beauty", price: "৳ 980", rating: "4.8", reviews: "59", image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=700&q=85", tone: "bg-[#f5eee9]" }
];

function SectionTitle({ eyebrow, title, detail, href = "/products" }: { eyebrow: string; title: string; detail: string; href?: string }) {
  return <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7"><div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-brand-600">{eyebrow}</p><h2 className="text-[22px] font-extrabold tracking-[-.8px] text-[#26183c] sm:text-[29px]">{title}</h2><p className="mt-1 text-xs text-[#958ba2] sm:text-sm">{detail}</p></div><Link href={href} className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand-700 transition hover:gap-2">View all <ArrowRight size={15}/></Link></div>;
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <SiteHeader/>
      <section className="container-shell pb-9 pt-3 sm:pb-14 sm:pt-6">
        <div className="relative isolate overflow-hidden rounded-[25px] bg-[#f0eaff] sm:rounded-[32px]">
          <div className="absolute -right-20 -top-28 h-[390px] w-[390px] rounded-full border border-white/60 sm:right-10 sm:top-[-210px] sm:h-[620px] sm:w-[620px]"/>
          <div className="absolute -right-8 bottom-[-180px] h-[330px] w-[330px] rounded-full bg-[#dfd0ff]/70 blur-[1px] sm:right-20 sm:h-[480px] sm:w-[480px]"/>
          <div className="relative grid min-h-[390px] items-center gap-3 px-6 py-9 sm:min-h-[440px] sm:px-12 sm:py-12 lg:grid-cols-[1.05fr_.95fr] lg:px-[70px]">
            <div className="relative z-10 max-w-[540px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-brand-700 sm:text-[11px]"><Sparkles size={13}/> A little more wonderful, every day</span>
              <h1 className="mt-5 text-[39px] font-extrabold leading-[1.08] tracking-[-2px] text-[#281743] sm:mt-6 sm:text-[54px] sm:tracking-[-2.8px] lg:text-[60px]">Find your kind<br className="hidden sm:block"/> of <span className="font-serif font-medium italic text-brand-600">everyday.</span></h1>
              <p className="mt-4 max-w-[390px] text-[13px] leading-6 text-[#6d5c83] sm:text-[15px] sm:leading-7">Thoughtful picks, lovely little discoveries, and the things you need — all in one happy place.</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"><Link href="/products" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white shadow-[0_9px_22px_rgba(116,52,223,.24)] transition hover:-translate-y-0.5 hover:bg-brand-700 sm:h-12 sm:px-6 sm:text-sm">Explore collection <ArrowUpRight size={16}/></Link><Link href="/categories" className="inline-flex h-11 items-center rounded-xl px-3 text-xs font-bold text-[#5b4777] hover:bg-white/60 sm:h-12 sm:text-sm">Browse categories</Link></div>
              <div className="mt-7 flex items-center gap-3 text-[10px] font-medium text-[#7f7094] sm:mt-9 sm:text-xs"><span className="flex -space-x-2"><span className="h-6 w-6 rounded-full border-2 border-[#f0eaff] bg-[#d9b8a6]"/><span className="h-6 w-6 rounded-full border-2 border-[#f0eaff] bg-[#9e86b9]"/><span className="h-6 w-6 rounded-full border-2 border-[#f0eaff] bg-[#d8c18e]"/></span> A growing community of happy shoppers</div>
            </div>
            <div className="relative hidden h-[340px] lg:block">
              <div className="absolute right-5 top-0 h-[330px] w-[290px] rotate-[5deg] overflow-hidden rounded-[150px_150px_28px_28px] border-[8px] border-white/70 shadow-[0_24px_55px_rgba(72,43,112,.16)]"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=90" alt="Curated wardrobe in soft natural light" className="h-full w-full object-cover"/></div>
              <div className="absolute bottom-1 left-1 z-10 w-[155px] overflow-hidden rounded-2xl border-4 border-white shadow-soft"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&q=85" alt="Warm, thoughtfully styled home interior" className="h-[125px] w-full object-cover"/></div>
              <div className="absolute right-0 top-7 z-10 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-soft backdrop-blur"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#a398b1]">Made for you</p><p className="mt-1 text-sm font-extrabold text-[#2d1d46]">Good finds. Good feels.</p></div>
            </div>
            <div className="relative mt-1 h-[180px] sm:h-[225px] lg:hidden">
              <div className="absolute right-3 top-0 h-[170px] w-[155px] rotate-[5deg] overflow-hidden rounded-[90px_90px_18px_18px] border-[5px] border-white/80 shadow-soft sm:right-10 sm:h-[215px] sm:w-[195px]"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&q=85" alt="Curated fashion collection" className="h-full w-full object-cover"/></div>
              <div className="absolute bottom-0 left-3 h-[95px] w-[115px] overflow-hidden rounded-xl border-4 border-white shadow-soft sm:left-16 sm:h-[125px] sm:w-[150px]"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&q=85" alt="Warm home inspiration" className="h-full w-full object-cover"/></div>
            </div>
          </div>
          <div className="absolute bottom-5 right-6 hidden items-center gap-1 lg:flex"><span className="h-1.5 w-7 rounded-full bg-brand-600"/><span className="h-1.5 w-1.5 rounded-full bg-brand-300"/><span className="h-1.5 w-1.5 rounded-full bg-brand-300"/></div>
        </div>
      </section>

      <section className="container-shell pb-12 sm:pb-16">
        <SectionTitle eyebrow="Explore the edit" title="Find your something" detail="A little inspiration for every part of your day." href="/categories"/>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map(c => <Link key={c.name} href="/categories" className="group rounded-2xl border border-[#f0edf4] bg-white p-3 text-center transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft sm:p-4"><div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl text-[27px] transition group-hover:scale-105 sm:h-[68px] sm:w-[68px] sm:text-[32px] ${c.color} ${c.ink}`}>{c.icon}</div><p className="mt-3 text-[11px] font-bold text-[#332547] sm:text-sm">{c.name}</p><p className="mt-1 hidden text-[10px] text-[#a097ad] sm:block">{c.sub}</p></Link>)}
        </div>
      </section>

      <section className="bg-[#faf9fc] py-10 sm:py-14">
        <div className="container-shell">
          <SectionTitle eyebrow="Handpicked for you" title="The good stuff" detail="Customer favourites worth a closer look."/>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">{products.map(p => <ProductCard key={p.name} product={p}/>)}</div>
        </div>
      </section>

      <section className="container-shell py-11 sm:py-16">
        <div className="relative overflow-hidden rounded-[24px] bg-[#261641] px-6 py-8 text-white sm:rounded-[30px] sm:px-12 sm:py-10">
          <div className="absolute -right-8 -top-28 h-72 w-72 rounded-full border border-white/10"/><div className="absolute -right-1 -top-20 h-56 w-56 rounded-full border border-white/10"/>
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div className="max-w-[500px]"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c7a9ff]">A little treat for you</p><h2 className="mt-2 text-[26px] font-extrabold tracking-[-1px] sm:text-[34px]">Your next favourite is waiting.</h2><p className="mt-2 text-xs leading-6 text-white/60 sm:text-sm">Discover fresh finds and lovely deals picked just for your everyday.</p></div><Link href="/deals" className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-[#382054] transition hover:bg-[#eee5ff]">See what’s new <ArrowRight size={15}/></Link></div>
        </div>
      </section>

      <section className="container-shell pb-12 sm:pb-16">
        <SectionTitle eyebrow="Just arrived" title="Fresh on the shelves" detail="New discoveries to make your day a little better."/>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{trending.map(p => <ProductCard key={p.name} product={p}/>)}</div>
      </section>

      <section className="border-y border-[#f0edf4] bg-[#fdfcff] py-7 sm:py-9">
        <div className="container-shell grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-4">
          {[{icon:Truck,title:"Delivery across Bangladesh",desc:"To all 64 districts"},{icon:ShieldCheck,title:"Shopping you can trust",desc:"Verified sellers & products"},{icon:RotateCcw,title:"Easy returns",desc:"Clear, fair return policies"},{icon:Headphones,title:"Here when you need us",desc:"Friendly customer support"}].map(item => <div key={item.title} className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><item.icon size={19}/></div><div><p className="text-[11px] font-bold text-[#38294e] sm:text-xs">{item.title}</p><p className="mt-1 text-[10px] text-[#a097ad]">{item.desc}</p></div></div>)}
        </div>
      </section>

      <footer className="bg-white pt-10 sm:pt-14">
        <div className="container-shell grid gap-9 pb-9 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div><Link href="/" className="inline-flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">a</span><span className="text-[25px] font-extrabold tracking-[-1.5px] text-[#24143f]">anan<span className="text-brand-600">.</span></span></Link><p className="mt-4 max-w-[260px] text-xs leading-6 text-[#8f849e]">A happier way to discover the things you love. Thoughtful finds, trusted sellers, all in one place.</p><p className="mt-4 text-[11px] font-semibold text-[#6c5d80]">Made with care in Bangladesh ♡</p></div>
          {[{title:"Discover",links:["All products","Categories","Today’s deals","New arrivals"]},{title:"Customer care",links:["Contact us","Shipping information","Returns & refunds","Help centre"]},{title:"About ANAN",links:["Our story","Sell on ANAN","Privacy policy","Terms & conditions"]}].map(group => <div key={group.title}><h3 className="mb-4 text-xs font-extrabold text-[#332547]">{group.title}</h3><ul className="space-y-3">{group.links.map(link => <li key={link}><Link href="#" className="text-[11px] text-[#8f849e] transition hover:text-brand-600">{link}</Link></li>)}</ul></div>)}
        </div>
        <div className="border-t border-[#f0edf4]"><div className="container-shell flex flex-col gap-2 py-5 text-[10px] text-[#a097ad] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 ANAN. All rights reserved.</span><span>Bangladesh · BDT ৳ · English</span></div></div>
      </footer>
    </main>
  );
}