import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Dumbbell, Calendar, BarChart3, Settings, Clock } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC = () => {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex-col">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <span className="hidden lg:block font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">IronLog</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem to="/workout" icon={<Dumbbell />} label="In-Gym" />
                    <NavItem to="/management" icon={<Calendar />} label="Management" />
                    <NavItem to="/history" icon={<Clock />} label="History" />
                    <NavItem to="/reports" icon={<BarChart3 />} label="Exercise History" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <NavItem to="/settings" icon={<Settings />} label="Settings" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pb-20 md:pb-0 relative">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-around items-center p-2 z-50 safe-area-bottom">
                <MobileNavItem to="/workout" icon={<Dumbbell />} label="Workout" />
                <MobileNavItem to="/management" icon={<Calendar />} label="Manage" />
                <MobileNavItem to="/history" icon={<Clock />} label="History" />
                <MobileNavItem to="/reports" icon={<BarChart3 />} label="Ex. History" />
                <MobileNavItem to="/settings" icon={<Settings />} label="Settings" />
            </nav>
        </div>
    );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                isActive
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )
        }
    >
        <span className="w-6 h-6">{icon}</span>
        <span className="hidden lg:block font-medium">{label}</span>
    </NavLink>
);

const MobileNavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                'flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-200',
                isActive
                    ? 'text-sky-400'
                    : 'text-slate-500 hover:text-slate-300'
            )
        }
    >
        <span className={clsx("mb-1 p-1 rounded-lg transition-colors", ({ isActive }: { isActive: boolean }) => isActive ? "bg-sky-500/10" : "")}>
            {React.cloneElement(icon as any, { size: 24 })}
        </span>
        <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
);

export default Layout;
