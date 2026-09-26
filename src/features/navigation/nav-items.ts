import {
  BarChart3,
  BookMarked,
  BookOpen,
  CheckSquare,
  Clock,
  Home,
  Layers,
  Moon,
  ScrollText,
  Settings,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  mobileLabel?: string;
  showInMobile?: boolean;
  showInMore?: boolean;
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home, mobileLabel: "Home", showInMobile: true },
  { title: "Prayer", href: "/prayer", icon: Sparkles, showInMobile: true },
  { title: "Tasks", href: "/tasks", icon: CheckSquare, mobileLabel: "Tasks", showInMobile: true },
  { title: "Habits", href: "/habits", icon: CheckSquare, mobileLabel: "Habits", showInMore: true },
  { title: "Study & Work", href: "/study", icon: BookMarked, showInMore: true },
  { title: "Subjects", href: "/subjects", icon: Layers, showInMore: true },
  { title: "Focus", href: "/focus", icon: Clock, mobileLabel: "Focus", showInMobile: true },
  { title: "Qur'an", href: "/quran", icon: BookOpen, showInMore: true },
  { title: "Hadith", href: "/hadith", icon: ScrollText, showInMore: true },
  { title: "Dhikr", href: "/dhikr", icon: Moon, showInMore: true },
  { title: "Goals", href: "/goals", icon: Target, showInMore: true },
  { title: "Analytics", href: "/analytics", icon: BarChart3, showInMore: true },
  { title: "Ramadan", href: "/ramadan", icon: Moon, showInMore: true },
  { title: "Settings", href: "/settings", icon: Settings, showInMore: true },
];

export const mobileNavItems = mainNavItems.filter((item) => item.showInMobile);

export const moreNavItems = mainNavItems.filter(
  (item) => item.showInMore || (!item.showInMobile && item.href !== "/dashboard"),
);
