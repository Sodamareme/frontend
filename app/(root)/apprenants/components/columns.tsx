"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Learner = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  referential: string;
  status: string;
  photoUrl: string;
};

export const columns: ColumnDef<Learner>[] = [
  {
    accessorKey: "photoUrl",
    header: "Photo",
    cell: ({ row }) => {
      const photoUrl = row.getValue("photoUrl") as string;
      const fullName = `${row.original.firstName} ${row.original.lastName}`;
      const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("");

      return (
        <Avatar>
          <AvatarImage src={photoUrl} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "matricule",
    header: "Matricule",
  },
  {
    accessorKey: "firstName",
    header: "Nom Complet",
    cell: ({ row }) => {
      return (
        <div>
          {row.original.firstName} {row.original.lastName}
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Adresse",
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
  },
  {
    accessorKey: "referential",
    header: "Référentiel",
    cell: ({ row }) => {
      const ref = row.getValue("referential") as string;
      const colorMap: { [key: string]: string } = {
        "DEV WEB/MOBILE": "text-green-500",
        "REF DIG": "text-blue-500",
        "DEV DATA": "text-purple-500",
        "AWS": "text-orange-500",
        "HACKEUSE": "text-pink-500",
      };

      return (
        <span className={`font-medium ${colorMap[ref] || "text-gray-500"}`}>
          {ref}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variantMap: { [key: string]: "success" | "warning" | "danger" } = {
        ACTIVE: "success",
        REPLACED: "warning",
        ABANDONED: "danger",
      };

      return (
        <Badge variant={variantMap[status] || "default"}>
          {status === "ACTIVE" ? "Actif" : status === "REPLACED" ? "Remplacé" : "Abandonné"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const learner = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(learner.id)}
            >
              Copier l&apos;ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Voir les détails</DropdownMenuItem>
            <DropdownMenuItem>Modifier</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];