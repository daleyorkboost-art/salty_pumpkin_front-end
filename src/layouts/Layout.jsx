import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getImageUrl } from '../utils/helpers';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAsync } from "../hooks/useAsync";
import { catalogApi } from "../services/api";

const navLinks = [
  ["Girls", "/product-category/girls-clothing", true],
  ["Boys", "/product-category/boys-clothing", true],
  ["Kids Essentials", "/shop?category=Kids%20Essentials", true],
  ["School Supplies", "/shop?category=School%20Supplies", true],
  ["Toys", "/shop?category=Toys", false],
  ["New Arrivals", "/collections/new-arrivals-summer-2026", false],
  ["Bestsellers", "/shop?sort=bestsellers", false],
  ["Fast Delivery", "/shop?delivery=fast", false],
];

const footerLinks = {
  shop: [["Girls", "/product-category/girls-clothing"], ["Boys", "/product-category/boys-clothing"], ["New Arrivals", "/collections/new-arrivals-summer-2026"], ["Bestsellers", "/shop?sort=bestsellers"], ["Sale", "/shop?search=sale"]],
  help: [["Track Order", "/order-tracking"], ["Returns & Refunds", "/returns-policy"], ["Size Guide", "/support"], ["Shipping Policy", "/shipping-policy"], ["FAQs", "/support"]],
};

const Caret = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>;

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();
  const { data } = useAsync(() => catalogApi.settings().catch(() => ({ settings: {} })), []);
  const settings = data?.settings || {};
  const logoUrl = getImageUrl(settings.store?.logoUrl || '/salty-pumpkin-logo.svg');
  const content = settings.content || {};
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!logoUrl) return;
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = logoUrl;
  }, [logoUrl]);

  function submitSearch(event) {
    event.preventDefault();
    const q = search.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar"><div className="wrap"><b>Rs. 200 coins</b> + flat 20% off on your first app order</div></div>

      <header className="header">
        <div className="wrap header-main">
          <Link className="brand" to="/" aria-label="Salty Pumpkin home">{logoUrl ? <img src={logoUrl} alt="Salty Pumpkin" /> : <strong>Salty Pumpkin</strong>}</Link>
          <form className="search" onSubmit={submitSearch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for Dresses" aria-label="Search products" />
          </form>
          <div className="icons">
            <NavLink className="iconbtn" to="/wishlist" aria-label={`Wishlist (${wishlist.count})`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z" /></svg>
              {wishlist.count > 0 && <span className="count">{wishlist.count}</span>}
            </NavLink>
            <NavLink className="iconbtn" to="/cart" aria-label={`Cart (${count})`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M6 6 5 2H2" /></svg>
              {count > 0 && <span className="count">{count}</span>}
            </NavLink>
            {user ? (
              <button className="iconbtn" onClick={signOut} aria-label="Log out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg></button>
            ) : (
              <NavLink className="iconbtn" to="/login" aria-label="Account"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></NavLink>
            )}
          </div>
        </div>
        <nav className="nav" aria-label="Categories"><div className="wrap">
          {navLinks.map(([label, href, caret]) => (
            <NavLink key={label} to={href} className={({ isActive }) => (isActive ? "active" : undefined)}>
              {label}{caret && <Caret />}
            </NavLink>
          ))}
          <NavLink to="/shop?search=sale" className="sale">Sale</NavLink>
          <NavLink to="/about">About Salty Pumpkin</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </div></nav>
      </header>

      <div className="marquee"><div>
        {[0, 1].map((item) => (
          <span key={item} style={{ display: "contents" }}>
            <span>SUMMER SALE | FLAT 20% OFF | CODE: SURPRISE20</span>
            <span>FREE SHIPPING OVER Rs. 999</span>
            <span>NEW ARRIVALS EVERY WEEK</span>
          </span>
        ))}
      </div></div>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="wrap">
          <div className="about">
            <Link className="brand" to="/">{logoUrl ? <img src={logoUrl} alt="Salty Pumpkin" /> : <strong>Salty Pumpkin</strong>}</Link>
            <p>Colourful kids' fashion, seasonal offers and easy online shopping for ages 0-10.</p>
            <div className="social">
              {content.contactInstagram && <a href={content.contactInstagram} target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg></a>}
              {content.contactFacebook && <a href={content.contactFacebook} target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z" /></svg></a>}
              {content.contactWhatsapp && <a href={`https://wa.me/${String(content.contactWhatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z" /></svg></a>}
            </div>
          </div>
          <div><h4>Shop</h4>{footerLinks.shop.map(([label, href]) => <Link key={label} to={href}>{label}</Link>)}</div>
          <div><h4>Help</h4>{footerLinks.help.map(([label, href]) => <Link key={label} to={href}>{label}</Link>)}</div>
          <div>
            <h4>Get in touch</h4>
            <a href="tel:+919426056067">+91 94260 56067</a>
            <a href="mailto:support@saltypumpkin.in">support@saltypumpkin.in</a>
            <span>Mon-Sat | 9 AM - 7 PM</span>
            <div className="pay"><span>VISA</span><span>Mastercard</span><span>UPI</span><span>PhonePe</span><span>G Pay</span></div>
          </div>
        </div>
        <div className="foot-bottom"><div className="wrap"><span>Copyright 2026 Salty Pumpkin. All rights reserved.</span><span>Privacy | Terms | Cookies</span></div></div>
      </footer>
    </div>
  );
}