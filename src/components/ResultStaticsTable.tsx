import { Button } from "@mantine/core"
import React from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "../hooks"
import { RoundInfo } from "../utilities"
import DataTable from "./DataTable"

const ResultStatisticsTable = () => {
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
  const navigate = useNavigate()

  const round = rounds[currentRound]

  if (!round) {
    return <></>
  }

  const statistics = Object.keys(
    (Object.values(Object.values(results ?? {})[0] ?? {})[0] ?? [])[0]
      ?.statistics ?? {},
  )

  const roundResults = ((results ?? {})[round.players.join(", ")] ?? {})[
    JSON.stringify(round.parameters)
  ]

  if (!roundResults) {
    return <></>
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <DataTable
        tableName="Results"
        data={{
          head: ["Seed"].concat(statistics),
          body: roundResults.map((result: any) =>
            [result.seed].concat(
              statistics.map((statistic) =>
                (result?.statistics ?? {})[statistic].toString(),
              ),
            ),
          ),
        }}
        renderValue={(rowIndex, columnName, value) => {
          if (columnName === "Seed") {
            return (
              <Button
                leftSection={<i className="fa-solid fa-play" />}
                onClick={() =>
                  navigate(
                    `/simulation/${round.players.map(encodeURIComponent).join(",")}?seed=${
                      value
                    }&${Object.keys(round.parameters)
                      .map(
                        (p) =>
                          `${p}=${encodeURIComponent(round.parameters[p])}`,
                      )
                      .join("&")}`,
                  )
                }
              >
                Play
              </Button>
            )
          }

          return <React.Fragment key={rowIndex}>{value}</React.Fragment>
        }}
      />
    </div>
  )
}

export default ResultStatisticsTable

