import { Boxes } from "lucide-react";
export function Logo({ compact = false }: { compact?: boolean }) { return <div className="brand"><span className="brand-mark"><Boxes size={22} strokeWidth={2.4} /></span>{!compact && <span><strong>StockSense</strong><small>Smart inventory</small></span>}</div>; }
