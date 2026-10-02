import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { AppShell } from "./components/AppShell";
import { LoadingState } from "./components/LoadingState";
import { AssistantPage } from "./pages/AssistantPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { InventoryPage } from "./pages/InventoryPage";
import { LoginPage } from "./pages/LoginPage";
import { ProductFormPage } from "./pages/ProductFormPage";
import { ProductPage } from "./pages/ProductPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ReportsPage } from "./pages/ReportsPage";

function ProtectedRoutes() { const { user, isLoading } = useAuth(); if (isLoading) return <LoadingState label="Opening StockSense…" />; return user ? <Outlet /> : <Navigate to="/login" replace />; }
function ManagerRoute() { const { user } = useAuth(); return user?.role === "MANAGER" ? <Outlet /> : <Navigate to="/products" replace />; }
export function App() { return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoutes />}><Route element={<AppShell />}><Route index element={<DashboardPage />} /><Route path="products" element={<ProductsPage />} /><Route path="products/:id" element={<ProductPage />} /><Route path="inventory/new" element={<InventoryPage />} /><Route path="history" element={<HistoryPage />} /><Route path="reports" element={<ReportsPage />} /><Route path="assistant" element={<AssistantPage />} /><Route element={<ManagerRoute />}><Route path="products/new" element={<ProductFormPage />} /><Route path="products/:id/edit" element={<ProductFormPage />} /></Route></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }

