"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// Re-export the root Dialog as-is
const DialogRoot = Dialog.Root;

// DialogTrigger with asChild support (maps to base-ui's render prop)
function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Trigger> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return <Dialog.Trigger render={children} {...props} />;
  }
  return <Dialog.Trigger {...props}>{children}</Dialog.Trigger>;
}

// Styled Portal/Backdrop/Popup wrapper
function DialogPopup({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Popup>) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
          "transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        )}
      />
      <Dialog.Popup
        className={cn(
          "fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center",
          className,
        )}
        {...props}
      >
        <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
          {children}
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

// Close button wrapper
function DialogClose({ className, ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Close>) {
  return (
    <Dialog.Close
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

// Content wrapper (adds close button)
function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      <DialogClose aria-label="Close">
        <X className="size-4" />
      </DialogClose>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1.5 pr-6", className)} {...props} />;
}

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogPopup,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
