"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";

const data = [
  {
    id: "1",
    matricule: "1058215",
    firstName: "Seydina Mouhammad",
    lastName: "Diop",
    address: "Sicap Liberté 6 villa 6059 Dakar, Sénégal",
    phone: "785993546",
    referential: "DEV WEB/MOBILE",
    status: "ACTIVE",
    photoUrl: "/placeholder.jpg"
  },
  // ... autres données
];

export default function LearnersPage() {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Apprenants (${data.length})`}
          description="Gérez les apprenants de Sonatel Academy"
        />
        <Button onClick={() => router.push(`/apprenants/nouveau`)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un apprenant
        </Button>
      </div>
      <Separator />
      <DataTable
        columns={columns}
        data={data}
        searchKey="firstName"
        searchPlaceholder="Rechercher un apprenant..."
      />
    </>
  );
}