"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BedDouble, DollarSign, Package, Settings, BarChart3, TrendingUp } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Occupancy report", href: "/occupancy", icon: BedDouble },
  { name: "Revenue report", href: "/revenue", icon: DollarSign },
  { name: "Forecast", href: "/forecast", icon: TrendingUp },
  { name: "Inventory report", href: "/inventory", icon: Package },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-300 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-gray-300 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black">
            <span className="text-sm font-heading font-medium text-white">M</span>
          </div>
          <div>
            <h1 className="text-sm font-heading font-medium text-black">Minima Hotel</h1>
            <p className="text-xs text-gray-500">Reports system</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          <div className="mb-4 px-3"><p className="text-xs font-medium text-gray-500">Main menu</p></div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-body transition-colors duration-200", isActive ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black")}>
                <item.icon className="h-4 w-4" />{item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-300 p-4">
          <div className="flex items-center gap-3 rounded-sm bg-gray-100 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200"><BarChart3 className="h-4 w-4 text-gray-500" /></div>
            <div className="flex-1"><p className="text-xs font-medium text-black">Data updated</p><p className="text-xs text-gray-500">5 minutes ago</p></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
