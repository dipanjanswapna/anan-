import { Heart, Star, ShoppingBag } from "lucide-react";

type Product = { name: string; category: string; price: string; oldPrice?: string; rating: string; reviews: string; image: string; badge?: string; tone: string };

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card group min-w-0 overflow-hidden rounded-2xl border border-[#eeeaf3] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#ded0f7] hover:shadow-soft">
      <div className={`relative aspect-[4/4.25] overflow-hidden ${product.tone}`}>
        <img src={product.image} alt={product.name} loading="lazy" className="product-image h-full w-full object-cover"/>
        {product.badge && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand-700 shadow-sm">{product.badge}</span>}
        <button aria-label={`Add ${product.name} to wishlist`} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#6d617d] shadow-sm transition hover:bg-white hover:text-rose-500"><Heart size={16}/></button>
        <button aria-label={`Quick add ${product.name}`} className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-white text-brand-700 opacity-0 shadow-md transition group-hover:translate-y-0 group-hover:opacity-100"><ShoppingBag size={16}/></button>
      </div>
      <div className="p-3.5 sm:p-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#a096ad]">{product.category}</p>
        <h3 className="line-clamp-2 min-h-[38px] text-[12px] font-semibold leading-[1.55] text-[#302344] sm:text-[13px]">{product.name}</h3>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-[#9b91a8]"><Star size={12} className="fill-[#f6b94b] text-[#f6b94b]"/><span className="font-semibold text-[#5d526d]">{product.rating}</span><span>({product.reviews})</span></div>
        <div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="text-[15px] font-extrabold tracking-tight text-[#27183e]">{product.price}</span>{product.oldPrice && <span className="text-[11px] text-[#aaa2b3] line-through">{product.oldPrice}</span>}</div>
      </div>
    </article>
  );
}