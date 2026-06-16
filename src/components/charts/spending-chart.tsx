import { AreaChart } from "@tremor/react"
import { formatRupiah } from "@/lib/debt-planner/format"

interface SpendingChartProps {
  data: { date: string; amount: number }[]
}

const valueFormatter = (number: number) =>
  `${formatRupiah(number)}`

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="h-64 w-full">
      <AreaChart
        className="h-full w-full"
        data={data}
        index="date"
        categories={["amount"]}
        colors={["indigo"]}
        valueFormatter={valueFormatter}
        showLegend={false}
        showYAxis={true}
        showGridLines={true}
        startEndOnly={false}
        curveType="monotone"
        showAnimation={true}
        animationDuration={1500}
      />
      <style jsx global>{`
        .tremor-AreaChart-gridline { stroke: rgba(255, 255, 255, 0.03) !important; }
        .tremor-AreaChart-xAxis, .tremor-AreaChart-yAxis { 
          font-size: 10px !important; 
          font-weight: 700 !important;
          color: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>
    </div>
  )
}
