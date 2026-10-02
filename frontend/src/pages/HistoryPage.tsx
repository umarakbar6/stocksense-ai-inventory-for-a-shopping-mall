import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { api, dateTime } from "../lib/api";
import type { Movement } from "../types";

export function HistoryPage() {
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const history = useQuery({ queryKey: ["movements", "history", type], queryFn: () => api<{ items: Movement[]; total: number }>(`/inventory/movements?pageSize=100${type ? `&type=${type}` : ""}`) });
  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return history.data?.items ?? [];
    return (history.data?.items ?? []).filter((item) => `${item.product.name} ${item.product.sku} ${item.actor.name}`.toLocaleLowerCase().includes(term));
  }, [history.data?.items, search]);
  return <section className="panel table-panel stagger-in"><div className="toolbar"><label className="search-box"><Search size={18}/><input placeholder="Search by product, SKU, or person…" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search stock history" /></label><select className="filter-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter movement type"><option value="">All movements</option><option value="STOCK_IN">Stock received</option><option value="SALE">Sales</option><option value="DAMAGED">Damaged</option><option value="ADJUSTMENT_IN">Adjusted up</option><option value="ADJUSTMENT_OUT">Adjusted down</option></select><button className="secondary-button" onClick={() => window.print()}><Download size={17}/> Export view</button></div>{history.isLoading ? <LoadingState/> : visibleItems.length ? <div className="responsive-table"><table><thead><tr><th>Product</th><th>Movement</th><th>Change</th><th>Balance</th><th>Recorded by</th><th>Date</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td><strong>{item.product.name}</strong><small>{item.product.sku}</small></td><td><span className={`type-pill ${item.delta > 0 ? "in" : "out"}`}>{item.type.replaceAll("_", " ")}</span></td><td className={item.delta > 0 ? "text-green" : "text-coral"}><strong>{item.delta > 0 ? "+" : ""}{item.delta}</strong></td><td>{item.beforeQuantity} → <strong>{item.afterQuantity}</strong></td><td>{item.actor.name}<small>{item.source === "AI" ? "AI confirmed" : "Normal form"}</small></td><td>{dateTime(item.occurredAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No matching history" detail="Try another search or movement type." />}</section>;
}

