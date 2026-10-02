export function LoadingState({ label = "Loading live inventory…" }: { label?: string }) { return <div className="loading-state"><span className="loader-orbit" /><p>{label}</p></div>; }
