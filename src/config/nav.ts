import {
  BookMarked,
  BookOpen,
  Bell,
  HelpCircle,
  LayoutDashboard,
  type LucideIcon,
  Radio,
  Settings,
  ShoppingBag,
  Info,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
  { label: "Live Classes", href: "/dashboard/live-classes", icon: Radio },
  { label: "All Courses", href: "/dashboard/browse", icon: BookMarked },
  { label: "About Us", href: "/dashboard/about", icon: Info },
  { label: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: 3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
];
