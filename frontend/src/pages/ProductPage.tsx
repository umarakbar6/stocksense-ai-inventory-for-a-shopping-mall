import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit3, PackagePlus, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { LoadingState } from "../components/LoadingState";
import { api, dateTime, money } from "../lib/api";
import type { Movement, Product } from "../types";

export function ProductPage() {
  const { id } = useParams(); const { user } = useAuth();
  const product = useQuery({ queryKey: ["product", id], queryFn: () => api<{ product: Product }>(`/products/${id}`), enabled: Boolean(id) });
  const history = useQuery({ queryKey: ["movements", id], queryFn: () => api<{ items: Movement[] }>(`/inventory/movements?productId=${id}&pageSize=10`), enabled: Boolean(id) });
  if (product.isLoading || !product.data) return <LoadingState />;
  const item = product.data.product;
  return <div className="detail-layout stagger-in"><section className="product-hero panel"><div className="detail-actions"><Link to="/products" className="back-link"><ArrowLeft size={17}/> Products</Link>{user?.role === "MANAGER" && <Link to={`/products/${item.id}/edit`} className="secondary-button"><Edit3 size={16}/> Edit</Link>}</div><div className="detail-identity"><div className="detail-monogram">{item.name.slice(0,2).toUpperCase()}</div><div><span className="category-tag">{item.category.name}</span><h2>{item.name}</h2><p>{item.sku}</p></div></div><div className="detail-stats"><div><small>Available</small><strong>{item.quantity}</strong><span>units</span></div><div><small>Low-stock line</small><strong>{item.lowStockThreshold}</strong><span>units</span></div><div><small>Selling price</small><strong>{money(item.sellingPriceMinor)}</strong><span>per unit</span></div>{item.costPriceMinor !== undefined && <div><small>Unit margin</small><strong>{money(item.unitMarginMinor ?? 0)}</strong><span>manager only</span></div>}</div><Link to={`/inventory/new?productId=${item.id}`} className="primary-button wide"><PackagePlus size={18}/> Record movement</Link></section>
    <section className="panel"><div className="panel-heading"><div><span>Recent trail</span><h3>Product movements</h3></div><ShieldCheck size={20}/></div><div className="movement-list">{history.data?.items.map((movement) => <div className="movement-row" key={movement.id}><span className={`movement-sign ${movement.delta > 0 ? "positive" : "negative"}`}>{movement.delta > 0 ? "+" : "−"}</span><span className="movement-main"><strong>{movement.type.replaceAll("_", " ")}</strong><small>{movement.actor.name} · {dateTime(movement.occurredAt)}</small></span><span>{movement.beforeQuantity} → {movement.afterQuantity}</span></div>)}</div></section>
  </div>;
}

