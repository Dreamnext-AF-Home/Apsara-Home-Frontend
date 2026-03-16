'use client';

const SummaryRow = ({ label, value}: { label: string, value: string }) => {
    return (
        <div className="flex items-start justify-between py-3 border-b border-indigo-50 last:border-0">
            <span className="text-[0.68rem] tracking-[0.12em] uppercase text-slate-400">{label}</span>
            <span className="text-[0.82rem] text-slate-700 text-right max-w-[60%]">{value || "—"}</span>
        </div>
    )
}

export default SummaryRow
