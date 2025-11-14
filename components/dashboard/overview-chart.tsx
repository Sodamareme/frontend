"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface OverviewChartProps {
  data: {
    name: string;
    present: number;
    retard: number;
    absent: number;
  }[];
}

export const OverviewChart = ({
  data
}: OverviewChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar
          dataKey="present"
          fill="#00A19C"
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
        <Bar
          dataKey="retard"
          fill="#FFB800"
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
        <Bar
          dataKey="absent"
          fill="#FF0000"
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};