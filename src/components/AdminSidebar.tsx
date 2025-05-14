import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Settings, 
  BookOpen, 
  BarChart, 
  LogOut,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => {
  return (
    <Link 
      to={href} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
        active 
          ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100 font-medium" 
          : "text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
      )}
    >
      <div className={cn(
        "w-6 h-6", 
        active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-500"
      )}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
};

export default function AdminSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="h-screen w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
      <div className="p-6">
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Support Dashboard</p>
      </div>
      
      <div className="px-3 flex-1 space-y-1">
        <SidebarItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          href="/admin" 
          active={isActive("/admin")} 
        />
        <SidebarItem 
          icon={<Ticket size={20} />} 
          label="Tickets" 
          href="/admin/tickets" 
          active={isActive("/admin/tickets") || isActive("/admin")} 
        />
        <SidebarItem 
          icon={<MessageCircle size={20} />} 
          label="Conversations" 
          href="/admin/conversations" 
          active={isActive("/admin/conversations")} 
        />
        <SidebarItem 
          icon={<Users size={20} />} 
          label="Customers" 
          href="/admin/customers" 
          active={isActive("/admin/customers")} 
        />
        <SidebarItem 
          icon={<BookOpen size={20} />} 
          label="Knowledge Base" 
          href="/admin/knowledge" 
          active={isActive("/admin/knowledge")} 
        />
        <SidebarItem 
          icon={<BarChart size={20} />} 
          label="Analytics" 
          href="/admin/analytics" 
          active={isActive("/admin/analytics")} 
        />
      </div>
      
      <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
        <SidebarItem 
          icon={<Settings size={20} />} 
          label="Settings" 
          href="/admin/settings" 
          active={isActive("/admin/settings")} 
        />
        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/10 transition-all">
          <LogOut size={20} className="text-gray-500 dark:text-gray-500" />
          <span>Switch to Customer</span>
        </Link>
      </div>
    </div>
  );
}
