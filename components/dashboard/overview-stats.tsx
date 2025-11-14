"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, Building2 } from "lucide-react";

const stats = [
  {
    title: "Apprenants",
    value: "180",
    icon: Users,
    color: "text-brand-orange",
  },
  {
    title: "Référentiels",
    value: "5",
    icon: BookOpen,
    color: "text-brand-teal",
  },
  {
    title: "Stagiaires",
    value: "5",
    icon: GraduationCap,
    color: "text-blue-500",
  },
  {
    title: "Permanant",
    value: "13",
    icon: Building2,
    color: "text-purple-500",
  },
];

export const OverviewStats = () => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};