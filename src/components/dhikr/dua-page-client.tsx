"use client";

import {
  BookOpen,
  Compass,
  GraduationCap,
  Heart,
  Moon,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Star,
  Sunrise,
  Sunset,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CanonicalDua, DuaCategory } from "@/services/dhikr/dhikr-types";
import {
  addDhikrFavorite,
  getAllDuas,
  getDuasByCategory,
  isDhikrFavorite,
  removeDhikrFavorite,
  getDhikrFavorites,
  searchDuas,
} from "@/services/dhikr/dhikr-service";

// ─── Category Metadata ────────────────────────────────────────────────────────

const DUA_CATEGORY_META: Record<DuaCategory | "all" | "favorites", { label: string; icon: LucideIcon }> = {
  all: { label: "All Duas", icon: BookOpen },
  favorites: { label: "Favorites", icon: Heart },
  morning: { label: "Morning", icon: Sunrise },
  evening: { label: "Evening", icon: Sunset },
  sleep: { label: "Sleep", icon: Moon },
  travel: { label: "Travel", icon: Compass },
  knowledge: { label: "Knowledge", icon: GraduationCap },
  forgiveness: { label: "Forgiveness", icon: RotateCcw },
  protection: { label: "Protection", icon: Shield },
  family: { label: "Family", icon: Users },
  rizq: { label: "Rizq", icon: Sparkles },
  ramadan: { label: "Ramadan", icon: Star },
  general: { label: "General", icon: Sparkles },
};

const DUA_CATEGORY_ORDER: (DuaCategory | "all" | "favorites")[] = [
  "all", "favorites", "morning", "evening", "forgiveness",
  "knowledge", "protection", "family", "rizq", "ramadan",
  "sleep", "travel", "general",
];

const MOCK_USER_ID = "local-user";

// ─── Dua Card ─────────────────────────────────────────────────────────────────

function DuaCard({
  dua,
  isFav,
  onToggleFavorite,
}: {
  dua: CanonicalDua;
  isFav: boolean;
  onToggleFavorite: (d: CanonicalDua) => void;
}) {
  return (
    <Card className="group transition-all hover:border-primary/30 hover:shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="space-y-3">
          {/* Arabic */}
          <p
            className="text-2xl leading-[2] text-foreground sm:text-3xl"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "serif" }}
          >
            {dua.arabic}
          </p>

          {/* Translation */}
          {dua.transliteration && (
            <p className="text-sm font-medium text-primary/80">{dua.transliteration}</p>
          )}
          <p className="text-sm text-muted-foreground">{dua.translationEn}</p>
          {dua.translationBn && (
            <p className="text-xs text-muted-foreground/70">{dua.translationBn}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {DUA_CATEGORY_META[dua.category]?.label ?? dua.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{dua.source}</span>
            {dua.grade && dua.grade !== "ungraded" && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {dua.grade}
              </Badge>
            )}
          </div>

          {/* Reference */}
          <p className="text-[10px] text-muted-foreground/60">{dua.reference}</p>

          {dua.notes && (
            <p className="text-[10px] text-muted-foreground/50 italic">{dua.notes}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onToggleFavorite(dua)}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "size-4 transition-colors",
                  isFav ? "fill-red-500 text-red-500" : "text-muted-foreground",
                )}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DuaPageClient() {
  const [activeCategory, setActiveCategory] = useState<DuaCategory | "all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    const favs = getDhikrFavorites(MOCK_USER_ID);
    return new Set(favs.map((f) => f.dhikrId));
  });

  // Get filtered duas
  const filteredItems = useMemo(() => {
    if (searchQuery.trim()) {
      return searchDuas(searchQuery.trim());
    }
    if (activeCategory === "all") {
      return getAllDuas();
    }
    if (activeCategory === "favorites") {
      return getAllDuas().filter((d) => favoriteIds.has(d.id));
    }
    return getDuasByCategory(activeCategory);
  }, [activeCategory, searchQuery, favoriteIds]);

  const handleToggleFavorite = useCallback(
    (dua: CanonicalDua) => {
      if (isDhikrFavorite(MOCK_USER_ID, dua.id)) {
        removeDhikrFavorite(MOCK_USER_ID, dua.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(dua.id);
          return next;
        });
        toast.message("Removed from favorites");
      } else {
        addDhikrFavorite(MOCK_USER_ID, dua.id);
        setFavoriteIds((prev) => new Set(prev).add(dua.id));
        toast.success("Added to favorites");
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Duas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supplications from the Qur&apos;an and Sunnah.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search duas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          id="dua-search"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {DUA_CATEGORY_ORDER.map((cat) => {
          const CatIcon = DUA_CATEGORY_META[cat]?.icon;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery("");
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              {CatIcon && <CatIcon className="size-3.5" />}
              <span>{DUA_CATEGORY_META[cat]?.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No duas found matching your search."
                : activeCategory === "favorites"
                  ? "No favorites yet. Tap the heart icon to save duas."
                  : "No duas in this category."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} dua{filteredItems.length !== 1 && "s"}
          </p>
          {filteredItems.map((dua) => (
            <DuaCard
              key={dua.id}
              dua={dua}
              isFav={favoriteIds.has(dua.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
