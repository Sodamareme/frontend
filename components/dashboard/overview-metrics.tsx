"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  {
    title: "Taux d'insertion Professionnelle",
    value: "100%",
    color: "text-brand-teal",
  },
  {
    title: "Taux de Féminisation",
    value: "56%",
    color: "text-brand-orange",
  },
  {
    title: "Communauté de plus de",
    value: "1000",
    subtitle: "Développeurs",
    color: "text-blue-500",
  },
  {
    title: "4 Centres",
    value: "Dakar, Diamniadio",
    subtitle: "Ziguinchor, et Saint Louis",
    color: "text-purple-500",
  },
];

export const OverviewMetrics = () => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {metric.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};