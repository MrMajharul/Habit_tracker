import React from "react";
import {
  Banknote,
  Building2,
  Smartphone,
  PiggyBank,
  CreditCard,
  Utensils,
  Bus,
  BookOpen,
  Receipt,
  ShoppingBag,
  HeartPulse,
  Users,
  Gamepad2,
  HandHeart,
  Heart,
  Package,
  Wallet,
  Laptop,
  Gift,
  TrendingUp,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoneyAccountType } from "@/types/money";

export const ACCOUNT_TYPE_ICONS: Record<MoneyAccountType, LucideIcon> = {
  cash: Banknote,
  bank: Building2,
  mobile_wallet: Smartphone,
  savings: PiggyBank,
  other: CreditCard,
};

export function AccountTypeIcon({
  type,
  className,
}: {
  type: MoneyAccountType;
  className?: string;
}) {
  const Icon = ACCOUNT_TYPE_ICONS[type] ?? CreditCard;
  return <Icon className={cn("size-4 shrink-0", className)} />;
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Lucide icon identifiers & category names
  utensils: Utensils,
  food: Utensils,
  bus: Bus,
  transport: Bus,
  "book-open": BookOpen,
  education: BookOpen,
  receipt: Receipt,
  bills: Receipt,
  "shopping-bag": ShoppingBag,
  shopping: ShoppingBag,
  "heart-pulse": HeartPulse,
  health: HeartPulse,
  users: Users,
  family: Users,
  "gamepad-2": Gamepad2,
  entertainment: Gamepad2,
  "hand-heart": HandHeart,
  charity: HandHeart,
  heart: Heart,
  sadaqah: Heart,
  "piggy-bank": PiggyBank,
  savings: PiggyBank,
  package: Package,
  other: Package,
  wallet: Wallet,
  salary: Wallet,
  laptop: Laptop,
  freelance: Laptop,
  gift: Gift,
  "trending-up": TrendingUp,
  investment: TrendingUp,

  // Fallbacks for any legacy emoji strings to seamlessly render Lucide SVGs
  "🍕": Utensils,
  "🚌": Bus,
  "📚": BookOpen,
  "📄": Receipt,
  "🛍️": ShoppingBag,
  "🛍": ShoppingBag,
  "💊": HeartPulse,
  "👨‍👩‍👧": Users,
  "🎮": Gamepad2,
  "🤲": HandHeart,
  "💝": Heart,
  "🏦": PiggyBank,
  "📦": Package,
  "💰": Wallet,
  "💻": Laptop,
  "🎁": Gift,
  "📈": TrendingUp,
  "💵": Banknote,
  "📱": Smartphone,
  "🐖": PiggyBank,
  "💼": CreditCard,
};

export function CategoryIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const key = icon ? icon.toLowerCase().trim() : "";
  const Icon = CATEGORY_ICON_MAP[key] ?? Tag;
  return <Icon className={cn("size-4 shrink-0", className)} />;
}
