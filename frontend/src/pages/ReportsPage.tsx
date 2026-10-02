import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Crown, TrendingUp, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../auth/AuthProvider";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { api, money } from "../lib/api";
import type { Product } from "../types";

const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
const range = `from=${encodeURIComponent(weekStart.toISOString())}&to=${encodeURIComponent(now.toISOString())}`;
type TopRow = { product: { id: string; sku: string; name: string }; unitsSold: number };
export function ReportsPage() {
  const { user } = useAuth();
  const top = useQuery({ queryKey: ["reports", "top", range], queryFn: () => api<{ items: TopRow[] }>(`/reports/top-selling?${range}&limit=8`) });
  const low = useQuery({ queryKey: ["reports", "low-stock"], queryFn: () => api<{ items: Product[] }>("/reports/low-stock") });
  const financial = useQuery({ queryKey: ["reports", "financial", range], queryFn: () => api<{ unitsSold: number; revenueMinor: number; costMinor: number; profitMinor: number }>(`/reports/financial-summary?${range}`), enabled: user?.role === "MANAGER" });
  if (top.isLoading) return <LoadingState />;
  return <div className="stagger-in"><section className="report-strip"><article><span className="report-icon lime"><TrendingUp/></span><div><small>Units sold · 7 days</small><strong>{financial.data?.unitsSold ?? top.data?.items.reduce((sum,item)=>sum+item.unitsSold,0) ?? 0}</strong></div></article><article><span className="report-icon orange"><AlertTriangle/></span><div><small>Low-stock products</small><strong>{low.data?.items.length ?? 0}</strong></div></article>{user?.role === "MANAGER" && <><article><span className="report-icon violet"><WalletCards/></span><div><small>Revenue · 7 days</small><strong>{money(financial.data?.revenueMinor ?? 0)}</strong></div></article><article><span className="report-icon pink"><Crown/></span><div><small>Gross profit · 7 days</small><strong>{money(financial.data?.profitMinor ?? 0)}</strong></div></article></>}</section><section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><span>Last seven days</span><h3>Top-selling products</h3></div></div>{top.data?.items.length ? <div className="bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={top.data.items} layout="vertical" margin={{left:20}}><CartesianGrid stroke="#243a32" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="product.name" width={125} tick={{fill:"#b7cbc3",fontSize:12}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#10201b",border:"1px solid #29443a",borderRadius:14}}/><Bar dataKey="unitsSold" fill="#a8f36f" radius={[0,8,8,0]} animationDuration={900}/></BarChart></ResponsiveContainer></div> : <EmptyState title="No sales in this period" detail="Sales recorded through inventory will appear here." />}</article><article className="panel"><div className="panel-heading"><div><span>Restock priority</span><h3>Threshold watch</h3></div></div><div className="rank-list">{low.data?.items.slice(0,7).map((item,index)=><div key={item.id}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.name}<small>{item.sku}</small></strong><em>{item.quantity} left</em></div>)}</div></article></section></div>;
}

