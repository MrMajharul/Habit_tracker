"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SmartSuggestion } from "@/services/suggestions/types";

interface SmartSuggestionsCardProps {
  suggestion: SmartSuggestion;
}

export function SmartSuggestionsCard({ suggestion }: SmartSuggestionsCardProps) {
  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-400">
            <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400" />
            Suggested for you
          </CardTitle>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300"
          >
            Plan around Salah
          </Badge>
        </div>
        <p className="mt-1 text-base font-semibold text-foreground">
          {suggestion.contextTitle}
        </p>
        <p className="text-xs text-muted-foreground">
          {suggestion.contextSubtitle}
        </p>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        <div className="grid gap-2 sm:grid-cols-3">
          {suggestion.items.map((item) => (
            <Link
              key={item.id}
              href={item.actionUrl}
              className="group flex flex-col justify-between rounded-xl border border-border/60 bg-background/60 p-3 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="text-lg">{item.icon}</span>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {item.durationMinutes} min
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xs font-semibold text-foreground group-hover:text-emerald-800 dark:group-hover:text-emerald-200">
                  {item.title}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary">
                  <span>{item.actionLabel ?? "Open"}</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {suggestion.reflectionPrompt && (
          <div className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Prompt: </span>
            {suggestion.reflectionPrompt}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
