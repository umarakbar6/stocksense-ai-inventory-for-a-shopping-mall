import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { api, money } from "../lib/api";
import type { Product } from "../types";

export function ProductsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const products = useQuery({ queryKey: ["products", search], queryFn: () => api<{ items: Product[]; total: number }>(`/products?pageSize=100&search=${encodeURIComponent(search)}`) });
  return <div className="stagger-in"><div className="toolbar"><label className="search-box"><Search size={19}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product or SKU…" aria-label="Search products" /></label>{user?.role === "MANAGER" && <Link to="/products/new" className="primary-button"><Plus size={18}/> Add product</Link>}</div>
    {products.isLoading ? <LoadingState /> : products.data?.items.length ? <section className="product-grid">{products.data.items.map((item) => <Link to={`/products/${item.id}`} className="product-card" key={item.id}><div className="product-card-top"><span className="category-tag">{item.category.name}</span><ArrowUpRight size={18}/></div><div className="product-visual"><span>{item.name.slice(0, 2).toUpperCase()}</span><i className={item.quantity === 0 ? "danger" : item.isLowStock ? "warning" : "healthy"}>{item.quantity === 0 ? "Out" : item.isLowStock ? "Low" : "Healthy"}</i></div><h3>{item.name}</h3><p>{item.sku}</p><div className="product-meta"><span><small>On hand</small><strong>{item.quantity}</strong></span><span><small>Selling price</small><strong>{money(item.sellingPriceMinor)}</strong></span></div><div className="stock-bar"><span style={{ width: `${Math.min(100, Math.max(8, item.quantity / Math.max(item.lowStockThreshold * 2, 1) * 100))}%` }} /></div></Link>)}</section> : <EmptyState title="No matching products" detail="Try another name or SKU." />}
  </div>;
}
