import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendLabel,
  className 
}: StatCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
        {trend !== undefined && (
          <div className={`flex items-center mt-2 text-xs ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'transform rotate-180' : ''}`} />
            <span>{trend >= 0 ? '+' : ''}{trend}% {trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: string;
  customerSatisfaction: number;
  totalCustomers: number;
}

export default function DashboardStats({
  openTickets,
  resolvedTickets,
  averageResponseTime,
  customerSatisfaction,
  totalCustomers
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Open Tickets"
        value={openTickets}
        description="Active tickets requiring attention"
        icon={<AlertCircle className="h-4 w-4" />}
        trend={-5}
        trendLabel="from last week"
        className="border-l-4 border-l-amber-500"
      />
      <StatCard
        title="Resolved Tickets"
        value={resolvedTickets}
        description="Tickets closed this month"
        icon={<CheckCircle className="h-4 w-4" />}
        trend={12}
        trendLabel="from last month"
        className="border-l-4 border-l-green-500"
      />
      <StatCard
        title="Avg. Response Time"
        value={averageResponseTime}
        description="Time to first response"
        icon={<Clock className="h-4 w-4" />}
        trend={-15}
        trendLabel="faster than target"
        className="border-l-4 border-l-indigo-500"
      />
      <StatCard
        title="Customer Satisfaction"
        value={`${customerSatisfaction}%`}
        description={`Based on ${totalCustomers} customers`}
        icon={<Users className="h-4 w-4" />}
        trend={3}
        trendLabel="from last quarter"
        className="border-l-4 border-l-purple-500"
      />
    </div>
  );
}
