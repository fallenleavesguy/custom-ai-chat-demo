import ReactECharts from 'echarts-for-react'
import { memo, useMemo } from 'react'

type RawCandle =
  | [string, number, number, number, number]
  | {
      time: string
      open: number
      close: number
      low: number
      high: number
    }

type NormalizedCandle = {
  time: string
  open: number
  close: number
  low: number
  high: number
}

type KlineChartPayload = {
  title?: string
  candles?: RawCandle[]
  items?: RawCandle[]
}

const fallbackPayload: Required<KlineChartPayload> = {
  title: '示例 K 线',
  candles: [
    ['06-03', 3188, 3212, 3176, 3228],
    ['06-04', 3210, 3255, 3196, 3269],
    ['06-05', 3256, 3230, 3218, 3274],
    ['06-06', 3232, 3290, 3220, 3315],
    ['06-09', 3294, 3278, 3261, 3302],
    ['06-10', 3276, 3326, 3268, 3338],
  ],
  items: [],
}

const normalizeCandles = (payload: KlineChartPayload): NormalizedCandle[] => {
  const source = payload.candles ?? payload.items ?? fallbackPayload.candles

  return source.map((item) => {
    if (Array.isArray(item)) {
      const [time, open, close, low, high] = item
      return { time, open, close, low, high }
    }

    return item
  })
}

const parsePayload = (
  code: string,
): {
  title: string
  candles: NormalizedCandle[]
} => {
  try {
    const parsed = JSON.parse(code) as KlineChartPayload

    return {
      title: parsed.title ?? fallbackPayload.title,
      candles: normalizeCandles(parsed),
    }
  } catch {
    return {
      title: fallbackPayload.title,
      candles: fallbackPayload.candles.map((item) => {
        const [time, open, close, low, high] = item as [
          string,
          number,
          number,
          number,
          number,
        ]

        return { time, open, close, low, high }
      }),
    }
  }
}

type KlineChartProps = {
  code: string
}

const KlineChartImpl = ({ code }: KlineChartProps) => {
  const payload = useMemo(() => parsePayload(code), [code])
  const option = useMemo(
    () => ({
      animation: false,
      title: {
        text: payload.title,
        left: 12,
        top: 10,
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
          color: '#19304d',
        },
      },
      grid: {
        left: 12,
        right: 14,
        top: 44,
        bottom: 28,
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: payload.candles.map((item) => item.time),
        boundaryGap: true,
        axisLine: { lineStyle: { color: '#b8c6d8' } },
        axisLabel: { color: '#6a7e98' },
      },
      yAxis: {
        scale: true,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#e4ebf3' } },
        axisLabel: { color: '#6a7e98' },
      },
      series: [
        {
          type: 'candlestick',
          data: payload.candles.map((item) => [
            item.open,
            item.close,
            item.low,
            item.high,
          ]),
          itemStyle: {
            color: '#d45757',
            color0: '#4a86d9',
            borderColor: '#d45757',
            borderColor0: '#4a86d9',
          },
        },
      ],
    }),
    [payload],
  )

  return (
    <ReactECharts
      option={option}
      notMerge={true}
      lazyUpdate={true}
      className="kline-chart"
    />
  )
}

const areEqual = (prev: KlineChartProps, next: KlineChartProps) =>
  prev.code === next.code

export const KlineChart = memo(KlineChartImpl, areEqual)
