import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, Boxes, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { api, dateTime } from "../lib/api";
import type { Movement, Product } from "../types";

export function DashboardPage() {
  const summary = useQuery({ queryKey: ["inventory", "summary"], queryFn: () => api<{ totalProducts: number; totalUnits: number; outOfStock: number; lowStock: number }>("/inventory/summary") });
  const low = useQuery({ queryKey: ["reports", "low-stock"], queryFn: () => api<{ items: Product[] }>("/reports/low-stock") });
  const history = useQuery({ queryKey: ["movements", "recent"], queryFn: () => api<{ items: Movement[]; total: number }>("/inventory/movements?pageSize=7") });
  if (summary.isLoading) return <LoadingState />;
  const stats = [
    { label: "Active products", value: summary.data?.totalProducts ?? 0, note: "across four departments", icon: Boxes, tone: "violet" },
    { label: "Units on hand", value: summary.data?.totalUnits ?? 0, note: "tracked in real time", icon: PackageCheck, tone: "green" },
    { label: "Needs attention", value: summary.data?.lowStock ?? 0, note: "at or below threshold", icon: AlertTriangle, tone: "orange" },
    { label: "Out of stock", value: summary.data?.outOfStock ?? 0, note: "ready for replenishment", icon: ShoppingBag, tone: "pink" },
  ];
  const chartData = [...(history.data?.items ?? [])].reverse().map((item, index) => ({ name: index + 1, quantity: item.afterQuantity }));
  return <div className="stagger-in">
    <section className="insight-banner"><div><span><Sparkles size={16} /> Today’s focus</span><h2>{summary.data?.lowStock ? `${summary.data.lowStock} ${summary.data.lowStock === 1 ? "product needs" : "products need"} a quick stock check.` : "Your stock levels are looking healthy."}</h2><p>Stay ahead of empty shelves with live thresholds and traceable movements.</p></div><Link className="light-button" to="/reports">View insights <ArrowUpRight size={17} /></Link></section>
    <section className="metric-grid">{stats.map(({ label, value, note, icon: Icon, tone }) => <article className={`metric-card ${tone}`} key={label}><div className="metric-icon"><Icon size={21} /></div><p>{label}</p><strong>{value.toLocaleString()}</strong><span>{note}</span></article>)}</section>
    <section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><span>Inventory pulse</span><h3>Movement trend</h3></div><div className="legend-dot">Recent balance</div></div>{chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8be04e" stopOpacity={.55}/><stop offset="100%" stopColor="#8be04e" stopOpacity={.02}/></linearGradient></defs><XAxis dataKey="name" hide/><Tooltip contentStyle={{ background: "#10201b", border: "1px solid #29443a", borderRadius: 14 }}/><Area type="monotone" dataKey="quantity" stroke="#a8f36f" strokeWidth={3} fill="url(#stockFill)" animationDuration={900}/></AreaChart></ResponsiveContainer></div> : <EmptyState title="No movements yet" detail="Record stock to bring this pulse to life." />}</article>
      <article className="panel alert-panel"><div className="panel-heading"><div><span>Smart threshold</span><h3>Low-stock radar</h3></div><Link to="/reports">See all</Link></div><div className="alert-list">{low.data?.items.slice(0, 5).map((item) => <Link to={`/products/${item.id}`} className="alert-row" key={item.id}><span className="stock-orb">{item.quantity}</span><span><strong>{item.name}</strong><small>{item.sku} · threshold {item.lowStockThreshold}</small></span><ArrowUpRight size={16}/></Link>)}{!low.data?.items.length && <EmptyState title="All clear" detail="No products are below their thresholds." />}</div></article>
    </section>
    <section className="panel"><div className="panel-heading"><div><span>Audit trail</span><h3>Latest movements</h3></div><Link to="/history">Full history</Link></div><div className="movement-list">{history.data?.items.map((item) => <div className="movement-row" key={item.id}><span className={`movement-sign ${item.delta > 0 ? "positive" : "negative"}`}>{item.delta > 0 ? "+" : "−"}</span><span className="movement-main"><strong>{item.product.name}</strong><small>{item.actor.name} · {dateTime(item.occurredAt)}</small></span><span className="movement-type">{item.type.replaceAll("_", " ")}</span><strong className={item.delta > 0 ? "text-green" : "text-coral"}>{item.delta > 0 ? "+" : ""}{item.delta}</strong></div>)}</div></section>
  </div>;
}

