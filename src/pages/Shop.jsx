import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { ErrorState, Loading } from "../components/Status";
import { useAsync } from "../hooks/useAsync";
import { catalogApi } from "../services/api";

const CATEGORY_TREE = {
  Boys: ["T-Shirts", "Shirts", "Shorts", "Jeans", "Ethnic Wear", "Jackets", "Co-Ords"],
  Girls: ["Dresses", "Tops", "Skirts", "Shorts", "Ethnic Wear", "Jumpsuits", "Co-Ords"],
};
const AGE_GROUPS = ["18-24M", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y", "12-13Y", "13-14Y", "14-15Y", "15-16Y"];
const NEW_ARRIVAL_CUTOFF = Date.now() - 120 * 24 * 60 * 60 * 1000;

export function Shop() {
  const location = useLocation();
  const params = useParams();
  const searchParams = new URLSearchParams(location.search);
  const queryCategory = searchParams.get("category");
  const querySearch = searchParams.get("search") || "";
  const routeCategory = normalizeRouteCategory(params.category || params.collection);
  const initialCategory = queryCategory || routeCategory || "All";
  const [query, setQuery] = useState(querySearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");
  const [priceRange, setPriceRange] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");

  // Backend handles search, filtering, and sorting
  const { loading, data, error } = useAsync(
    () => catalogApi.products({
      category: category === "All" ? undefined : category,
      search: query,
      sort,
      priceRange: priceRange === "All" ? undefined : priceRange,
      ageGroup: ageGroup === "All" ? undefined : ageGroup,
    }),
    [category, query, sort, priceRange, ageGroup]
  );

  const products = data?.products || [];
  const settings = data?.settings || {};
  const filters = settings.filters || {};
  const managedCategories = splitList(filters.categories);
  const categories = ["All", ...new Set([
    ...Object.keys(CATEGORY_TREE),
    ...(managedCategories.length ? managedCategories : products.flatMap((product) => [product.childCategory, product.category]).filter(Boolean)),
  ])];
  const ageValues = splitList(filters.ageGroups);
  const priceValues = splitList(filters.priceRanges);
  const shopByValues = splitList(filters.shopBy);

  useEffect(() => {
    setCategory(queryCategory || routeCategory || "All");
    setQuery(querySearch);
  }, [queryCategory, querySearch, routeCategory]);

  const suggestions = (data?.suggestions || []).slice(0, 6);

  return (
    <section className="section page-section shop-shell collection-shell">
      <div className="shop-head">
        <div>
          <p className="breadcrumb">Home / Collections</p>
          <h1>{category === "All" ? "New Arrivals Summer 2026" : category}</h1>
          <p className="collection-count">{products.length} items</p>
        </div>
        <div className="toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, SKU, category" list="product-search-suggestions" />
          <datalist id="product-search-suggestions">{suggestions.map((item) => <option value={item} key={item} />)}</datalist>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="featured">Sort by Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
      {loading && <Loading label="Loading collection..." />}
      {error && <ErrorState message={error} />}
      <div className="topline-filters">
        <button className="pill strong" type="button">Filters</button>
        <button className="pill strong" type="button">Sort</button>
        <FilterChip label="Gender" />
        <FilterChip label="Age" />
        <FilterChip label="Category" />
        <FilterChip label="Type" />
        <FilterChip label="Price Range" />
        <FilterChip label="Discount" />
        <FilterChip label="Delivery Method" />
      </div>
      <div className="shop-layout">
        <aside className="shop-filters">
          <h2>Filter By</h2>
          <FilterBlock title="Shop by" items={shopByValues.length ? shopByValues : ["All", "Boys", "Girls"]} active={category} onSelect={setCategory} />
          <FilterBlock title="Categories" items={categories.filter((item) => !["All", "Boys", "Girls"].includes(item))} active={category} onSelect={setCategory} />
          <FilterBlock title="Price" items={priceValues.length ? priceValues : ["All", "Rs. 0 - 999", "Rs. 1000 - 1999", "Rs. 2000+"]} active={priceRange} onSelect={setPriceRange} />
          <FilterBlock title="Age Group" items={["All", ...(ageValues.length ? ageValues : AGE_GROUPS)]} active={ageGroup} onSelect={setAgeGroup} />
          <div className="color-dots"><span /><span /><span /><span /><span /><span /></div>
        </aside>
        <div>
          <div className="results-bar"><span>{products.length ? `Showing 1-${products.length} of ${products.length} results` : "Showing 0 results"}</span></div>
          <div className="product-grid reference-products">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
          {!products.length && !loading && !error && <p className="empty-state">No published products match this collection yet.</p>}
        </div>
      </div>
    </section>
  );
}

function normalizeRouteCategory(value) {
  if (!value) return "";
  if (value === "new-arrivals-summer-2026" || value === "new-arrivals") return "New Arrivals Summer 2026";
  if (value === "boys-clothing" || value === "boys") return "Boys";
  if (value === "girls-clothing" || value === "girls") return "Girls";
  return value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function FilterChip({ label }) {
  return <button className="pill" type="button">{label}<span aria-hidden="true">v</span></button>;
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function FilterBlock({ title, items, active, onSelect = () => {} }) {
  return (
    <div className="filter-block">
      <h3>{title}</h3>
      {items.map((item) => (
        <button type="button" className={active === item ? "active" : ""} key={item} onClick={() => onSelect(item)}>{item}</button>
      ))}
    </div>
  );
}