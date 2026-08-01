import {
  BarChart3,
  BookMarked,
  BookOpen,
  Bell,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  Layers3,
  FileText,
  Radio,
  type LucideIcon,
  Settings,
  ShoppingBag,
  Info,
  UserRound,
  Users,
  ShieldCheck,
} from "lucide-react";
import type { User } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  roles?: User["role"][];
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["student"] },
  { label: "My Courses", href: "/dashboard/my-courses", icon: BookOpen, roles: ["student"] },
  { label: "Live Classes", href: "/dashboard/live-classes", icon: Radio, roles: ["student"] },
  { label: "All Courses", href: "/dashboard/browse", icon: BookMarked, roles: ["student"] },
  { label: "Blogs", href: "/blogs", icon: FileText, roles: ["student"] },
  { label: "About Us", href: "/dashboard/about", icon: Info, roles: ["student"] },
  { label: "My Orders", href: "/dashboard/orders", icon: ShoppingBag, roles: ["student"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["student"] },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["student"] },
  { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle, roles: ["student"] },
  { label: "Instructor Home", href: "/instructor/dashboard", icon: LayoutDashboard, roles: ["instructor"] },
  { label: "My Batches", href: "/instructor/batches", icon: Layers3, roles: ["instructor"] },
  { label: "My Blogs", href: "/instructor/blogs", icon: FileText, roles: ["instructor"] },
  { label: "Public Profile", href: "/instructor/settings/profile", icon: UserRound, roles: ["instructor"] },
  { label: "Admin Overview", href: "/admin", icon: BarChart3, roles: ["admin", "superadmin"] },
  { label: "Manage", href: "/admin/manage", icon: Users, roles: ["admin", "superadmin"] },
  { label: "Orders", href: "/admin?tab=orders", icon: ClipboardList, roles: ["admin", "superadmin"] },
  { label: "Admins", href: "/admin?tab=admins", icon: ShieldCheck, roles: ["superadmin"] },
];

export function sidebarNavForRole(role: User["role"]) {
  return SIDEBAR_NAV.filter((item) => !item.roles || item.roles.includes(role));
}
