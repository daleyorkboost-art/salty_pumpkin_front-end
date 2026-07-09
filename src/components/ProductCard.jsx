import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { productPayload, trackEvent } from "../services/tracking";
import { useWishlist } from "../context/WishlistContext";
import { getImageUrl } from '../utils/helpers';

export function ProductCard({ product }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const image = getImageUrl(product.images?.[0] || '/uploads/1_1.jpg');
  const onSale = product.mrp > product.price;
  const off = onSale ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  function addToCart() {
    add(product);
    trackEvent("add_to_cart", productPayload(product, 1));
  }

  return (
    <article className="product-card pcard">
      <Link to={`/shop/${product.slug}`} className="product-image">
        <span className="fast">Fast Delivery</span>
        {onSale && <span className="sale-badge">{off}% Off</span>}
        <img src={image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-copy">
        <h3><Link to={`/shop/${product.slug}`}>{product.name}</Link></h3>
        <p className="price">
          {onSale && <span>Rs. {Number(product.mrp || 0).toLocaleString("en-IN")}</span>}
          Rs. {Number(product.price || 0).toLocaleString("en-IN")}
        </p>
        <div className="product-actions">
          <button type="button" onClick={addToCart}>Add to cart</button>
          <button
            type="button"
            className={`wishlist-button ${wishlist.has(product._id) ? "active" : ""}`}
            aria-label={`${wishlist.has(product._id) ? "Remove" : "Add"} ${product.name} ${wishlist.has(product._id) ? "from" : "to"} wishlist`}
            aria-pressed={wishlist.has(product._id)}
            onClick={() => wishlist.toggle(product)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}