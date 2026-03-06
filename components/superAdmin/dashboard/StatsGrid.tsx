'use client';

import { motion } from "framer-motion";

interface StatCard {
    label: string;
    value: string;
    change: string;
    changeType: 'up' | 'down' | 'neutral'
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const stats: StatCard[] = [
    {
        label: 'Total Orders',
        value: '₱ 0.00',
        change: '+0% this month',
        changeType: 'neutral',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    },
    {
        label: 'Total Rewards Computed',
        value: '₱ 30,058.00',
        change: '+12.4% vs last month',
        changeType: 'up',
        color: 'text-teal-600',
        bgColor: 'bg-teal-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        label: 'Total Withdrawals Released',
        value: '₱ 0.00',
        change: 'No withdrawals yet',
        changeType: 'neutral',
        color: 'text-green-600',
        bgColor: 'bg-green-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
    },
    {
        label: 'Total Withdrawals Pending',
        value: '₱ 4,620.00',
        change: '3 pending requests',
        changeType: 'down',
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        label: 'Total Expenses',
        value: '₱ 1,000.00',
        change: '-5.2% vs last month',
        changeType: 'up',
        color: 'text-orange-600',
        bgColor: 'bg-orange-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    },
    {
        label: 'Total Members',
        value: '1',
        change: '+1 this week',
        changeType: 'up',
        color: 'text-purple-600',
        bgColor: 'bg-purple-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
        label: 'Total Merchants',
        value: '0',
        change: 'No merchants yet',
        changeType: 'neutral',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7l9-4 9 4-9 4-9-4zm0 10l9 4 9-4M3 12l9 4 9-4" /></svg>,
    },
    {
        label: 'Merchants Performance',
        value: '0%',
        change: 'No performance data yet',
        changeType: 'neutral',
        color: 'text-lime-600',
        bgColor: 'bg-lime-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },
    {
        label: 'New Merchants',
        value: '0',
        change: '+0 this month',
        changeType: 'neutral',
        color: 'text-fuchsia-600',
        bgColor: 'bg-fuchsia-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>,
    },
    {
        label: 'Merchant Payouts',
        value: 'â‚± 0.00',
        change: 'No payouts released',
        changeType: 'neutral',
        color: 'text-rose-600',
        bgColor: 'bg-rose-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a5 5 0 00-10 0v2m-2 0h14v11H5V9zm7 4v4" /></svg>,
    },
    {
        label: 'Total E-Wallet Float',
        value: '₱ 87,508.00',
        change: '+8.1% vs last month',
        changeType: 'up',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    },
    {
        label: 'Total GC Float',
        value: '₱ 15,308.00',
        change: '+3.7% vs last month',
        changeType: 'up',
        color: 'text-pink-600',
        bgColor: 'bg-pink-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
    },
    {
        label: "Today's Revenue",
        value: '₱ 0.00',
        change: 'No sales today',
        changeType: 'neutral',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },
    {
        label: 'Monthly Revenue',
        value: '₱ 0.00',
        change: 'No sales this month',
        changeType: 'neutral',
        color: 'text-sky-600',
        bgColor: 'bg-sky-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
        label: 'Active Sessions',
        value: '24',
        change: '+6 from yesterday',
        changeType: 'up',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>,
    },
    {
        label: 'Growth Rate',
        value: '+24.5%',
        change: '+2.3% vs last month',
        changeType: 'up',
        color: 'text-violet-600',
        bgColor: 'bg-violet-500',
        icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },
]

const StatsGrid = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-500 font-xs font-medium leading-snug mb-2">{stat.label}</p>
                            <p className="text-slate-800 font-bold text-xl leading-none">{stat.value}</p>
                        </div>
                        <div className={`${stat.bgColor} h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                        {stat.changeType === 'up' && (
                            <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>

                        )}
                        {stat.changeType === 'down' && (
                            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>

                        )}
                        <span className={`text-xs font-medium ${stat.changeType === 'up' ? 'text-green-600' : stat.changeType === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                            {stat.change}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

export default StatsGrid
