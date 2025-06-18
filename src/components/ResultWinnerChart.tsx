import { BarChart } from "@mantine/charts"
import React from "react"
import { useLocalStorage } from "../hooks"
import { RoundInfo } from "../utilities"

const ResultWinnerChart = ({ results: currentResults }: { results?: any }) => {
  const [results] = useLocalStorage<any>({
    key: "Results",
    defaultValue: {},
  })
  const [rounds] = useLocalStorage<RoundInfo[]>({
    key: "Rounds",
    defaultValue: [],
  })
  const [currentRound] = useLocalStorage<number>({
    key: "Current Round",
    defaultValue: 0,
  })

  const round = rounds[currentRound]

  if (!round) {
    return <></>
  }

  currentResults ??= ((results ?? {})[round.players.join(", ")] ?? {})[
    JSON.stringify(round.parameters)
  ]

  if (!currentResults) {
    return <></>
  }

  const winCounts: Record<string, number> = {}
  for (const result of currentResults) {
    const winner = round.players[result.places[0]]
    if (!winCounts[winner]) {
      winCounts[winner] = 1
    } else {
      winCounts[winner]++
    }
  }
  const winners = Object.keys(winCounts).sort()

  const data = winners.map((team, teamIndex) => ({
    team,
    Matches: winCounts[team],
  }))

  return (
    <BarChart
      mt="xs"
      h={300}
      data={data}
      series={[{ name: "Matches", color: "violet.6" }]}
      dataKey="team"
    />
  )
}

export default ResultWinnerChart

