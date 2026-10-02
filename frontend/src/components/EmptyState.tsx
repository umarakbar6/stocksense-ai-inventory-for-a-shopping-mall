import { PackageOpen } from "lucide-react";
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><PackageOpen size={34} /><h3>{title}</h3><p>{detail}</p></div>; }
