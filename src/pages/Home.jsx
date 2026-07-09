import { Link } from "react-router-dom";
import { ErrorState, Loading } from "../components/Status";
import { useAsync } from "../hooks/useAsync";
import { catalogApi } from "../services/api";
import { getImageUrl } from '../utils/helpers';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { productPayload, trackEvent } from "../services/tracking";

const Arrow = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Heart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z" /></svg>;
const Plus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>;
const Caret = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>;

const circleCats = [
  ["Girls", "/uploads/123_123.jpg", "/product-category/girls-clothing"],
  ["Boys", "/uploads/100_100.jpg", "/product-category/boys-clothing"],
  ["New Arrivals", "/uploads/11_11.jpg", "/collections/new-arrivals-summer-2026"],
  ["Dresses", "/uploads/103_Pink-103.jpg", "/shop?category=Dresses"],
  ["Co-ord Sets", "/uploads/124_124.jpg", "/shop?category=Sets"],
  ["Sale", "/uploads/10_10.jpg", "/shop?search=sale"],
];

const filters = ["Gender", "Age", "Category", "Type", "Price Range", "Discount", "Delivery Method"];

function PCard({ product, badge }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const image = getImageUrl(product.images?.[0] || "/uploads/1_1.jpg");
  const onSale = product.mrp > product.price;
  const off = onSale ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <article className="pcard">
      <div className="pc-img">
        <span className="fast">Fast Delivery</span>
        <button
          className="wish"
          aria-label={`${wishlist.has(product._id) ? "Remove" : "Add"} ${product.name} ${wishlist.has(product._id) ? "from" : "to"} wishlist`}
          aria-pressed={wishlist.has(product._id)}
          onClick={() => wishlist.toggle(product)}
        ><Heart /></button>
        <button
          className="plus"
          aria-label={`Add ${product.name} to cart`}
          onClick={() => { add(product); trackEvent("add_to_cart", productPayload(product, 1)); }}
        ><Plus /></button>
        {onSale && <span className="sale-badge">{off}% Off</span>}
        <Link to={`/shop/${product.slug}`}><img src={image} alt={product.name} loading="lazy" /></Link>
      </div>
      <div className="pc-body">
        {badge && <div className="tag">{badge}</div>}
        <h3><Link to={`/shop/${product.slug}`}>{product.name}</Link></h3>
        <div className="pc-price">
          <b>Rs. {Number(product.price || 0).toLocaleString("en-IN")}</b>
          {onSale && <del>Rs. {Number(product.mrp || 0).toLocaleString("en-IN")}</del>}
          {onSale && <span className="off">{off}% off</span>}
        </div>
      </div>
    </article>
  );
}

export function Home() {
  const { loading, data, error } = useAsync(async () => {
    const [catalog, settings] = await Promise.all([
      catalogApi.products(),
      catalogApi.settings().catch(() => ({ settings: {} })),
    ]);
    return { catalog, settings: settings.settings || {} };
  });

  const products = data?.catalog?.products || [];
  const content = data?.settings?.content || {};
  const activeCoupon = (data?.settings?.coupons?.items || []).find((coupon) => coupon.active !== false);
  const banner = (content.banners || []).find((item) => item.enabled !== false);
  const heroImage = getImageUrl(banner?.image || "/uploads/10_10.jpg");
  const code = activeCoupon?.code || "SURPRISE20";
  const saleItems = products.slice(0, 8);
  const freshItems = products.slice(8, 12).length ? products.slice(8, 12) : products.slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-card">
            <div className="hero-text">
              <span className="eyebrow">Summer Sale</span>
              <h1>{banner?.title || "New Arrivals Summer 2026"}</h1>
              <p>{banner?.subtitle || "Fresh, playful styles for ages 0-10. Easy sets, dresses, tees and school-day essentials delivered fast."}</p>
              <span className="hero-code">CODE | {code}</span>
              <div className="hero-cta">
                <Link className="btn btn-orange" to="/collections/new-arrivals-summer-2026">Shop new arrivals <Arrow /></Link>
                <Link className="btn btn-dark" to="/shop?search=sale">Shop sale</Link>
              </div>
            </div>
            <div className="hero-img"><img src={heroImage} alt="Kids summer collection" /></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head"><div><h2>Shop by category</h2><p>Find their next favourite</p></div><Link to="/shop">View all <Arrow /></Link></div>
          <div className="circles">
            {circleCats.map(([label, img, href]) => (
              <Link className="circle" to={href} key={label}>
                <span className="ph"><img src={getImageUrl(img)} alt="" loading="lazy" /></span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="title-row"><h2>New Arrivals Summer 2026</h2><span className="count">{products.length} items</span></div>
          <div className="filters">
            <button className="pill strong" type="button">Filters</button>
            <button className="pill strong" type="button">Sort</button>
            {filters.map((filter) => <button className="pill" type="button" key={filter}>{filter} <Caret /></button>)}
          </div>
          {loading && <Loading label="Loading products..." />}
          {error && <ErrorState message={error} />}
          <div className="grid">
            {saleItems.map((product, index) => <PCard key={product._id} product={product} badge={index % 3 === 0 ? "Bestseller" : null} />)}
          </div>
        </div>
      </section>

      <section className="section compact-section">
        <div className="wrap">
          <div className="banners">
            <Link className="banner b1" to="/product-category/girls-clothing"><small>Girls collection</small><h3>Twirl-worthy dresses and frocks</h3><span>Shop girls</span></Link>
            <Link className="banner b2" to="/product-category/boys-clothing"><small>Boys collection</small><h3>Comfy tees, sets and jackets</h3><span>Shop boys</span></Link>
          </div>
        </div>
      </section>

      <section className="section compact-section">
        <div className="wrap">
          <div className="sec-head"><div><h2>Fresh arrivals</h2><p>Just dropped this week</p></div><Link to="/collections/new-arrivals-summer-2026">View all <Arrow /></Link></div>
          <div className="grid">
            {freshItems.map((product) => <PCard key={`new-${product._id}`} product={product} badge="New" />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="usp"><div className="wrap2">
          <div className="u"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h13v8H3zM16 10h4l2 3v2h-6" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="18" cy="17.5" r="1.6" /></svg></span><div><strong>Free Shipping</strong><span>On orders above Rs. 999</span></div></div>
          <div className="u"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" /></svg></span><div><strong>7-Day Returns</strong><span>Easy and hassle-free</span></div></div>
          <div className="u"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /></svg></span><div><strong>COD Available</strong><span>Pay on delivery</span></div></div>
          <div className="u"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6Z" /><path d="m9 12 2 2 4-4" /></svg></span><div><strong>Secure Payments</strong><span>100% safe and trusted</span></div></div>
        </div></div>
      </section>
    </>
  );
}