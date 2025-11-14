"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const routes = [
    {
      href: `/dashboard`,
      label: "Tableau de bord",
      active: pathname === `/dashboard`,
    },
    {
      href: `/promotions`,
      label: "Promotions",
      active: pathname === `/promotions`,
    },
    {
      href: `/referentiels`,
      label: "Référentiels",
      active: pathname === `/referentiels`,
    },
    {
      href: `/apprenants`,
      label: "Apprenants",
      active: pathname === `/apprenants`,
    },
    {
      href: `/presences`,
      label: "Gestion des présences",
      active: pathname === `/presences`,
    },
    {
      href: `/kits`,
      label: "Kits & Laptops",
      active: pathname === `/kits`,
    },
    {
      href: `/modules`,
      label: "Modules",
      active: pathname === `/modules`,
    },
  ];

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-brand-orange",
            route.active ? "text-brand-orange" : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}