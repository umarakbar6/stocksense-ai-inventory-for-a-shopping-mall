import { Bot, Boxes, ChartNoAxesCombined, History, LayoutDashboard, LogOut, Menu, PackagePlus, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Boxes },
  { to: "/inventory/new", label: "Record stock", icon: PackagePlus },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { to: "/assistant", label: "AI assistant", icon: Bot, badge: "Live" },
] as const;

const headings: Record<string, [string, string]> = {
  "/": ["Good inventory starts here", "A live pulse of Nowshera Shopping Mall."],
  "/products": ["Product universe", "Search, inspect, and manage every aisle."],
  "/inventory/new": ["Record a movement", "Keep every unit accountable."],
  "/history": ["Stock history", "A transparent trail of every movement."],
  "/reports": ["Reports that speak clearly", "Turn movements into decisions."],
  "/assistant": ["StockSense AI", "Natural language inventory, safely controlled."],
};

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, subtitle] = headings[location.pathname] ?? [location.pathname.includes("edit") ? "Edit product" : "Product detail", "Accurate data, clearly presented."];
  async function signOut() { await logout(); navigate("/login", { replace: true }); }
  return <div className="app-frame">
    <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
    {open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-top"><Logo /><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
      <nav className="main-nav"><p className="nav-label">Workspace</p>{links.map((link) => { const Icon = link.icon; const badge = "badge" in link ? link.badge : undefined; return <NavLink key={link.to} to={link.to} end={"end" in link ? link.end : undefined} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "active" : ""}><Icon size={19} /><span>{link.label}</span>{badge && <em>{badge}</em>}</NavLink>; })}</nav>
      <div className="sidebar-user"><span className="avatar">{user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span className="user-copy"><strong>{user?.name}</strong><small>{user?.role === "MANAGER" ? "Mall manager" : "Inventory staff"}</small></span><button className="icon-button" onClick={signOut} title="Sign out"><LogOut size={18} /></button></div>
    </aside>
    <main className="main-area"><header className="page-header"><div><p className="eyebrow">Live operations</p><h1>{title}</h1><p>{subtitle}</p></div><div className="live-pill"><span /> Live data</div></header><div className="page-content"><Outlet /></div></main>
  </div>;
}
