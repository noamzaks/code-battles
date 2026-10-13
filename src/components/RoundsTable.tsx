import React from "react"
import { RoundInfo } from "../utilities"

interface Props {
  rounds: RoundInfo[]
  results: any
  roundIterations: number
  actions?: (round: RoundInfo, index: number) => React.ReactNode
}

const RoundsTable: React.FC<Props> = ({
  rounds,
  results,
  roundIterations,
  actions,
}) => {
  return (
    <table style={{ textAlign: "center" }}>
      <thead>
        <tr>
          <th style={{ width: "25%" }}>Parameters</th>
          <th style={{ width: "35%" }}>Players</th>
          {roundIterations === 1 && (
            <>
              <th style={{ width: "17.5%" }}>1st Place</th>
              <th style={{ width: "17.5%" }}>2nd Place</th>
            </>
          )}
          {roundIterations !== 1 && <th style={{ width: "35%" }}>Results</th>}
          {actions && <th></th>}
        </tr>
      </thead>
      <tbody>
        {rounds.map((round, index) => {
          const winCounts: Record<string, number> = {}
          if (results[round.players.join(", ")] !== undefined) {
            const currentResults =
              results[round.players.join(", ")][
                JSON.stringify(round.parameters)
              ] ?? []
            for (const result of currentResults) {
              const winner = round.players[result.places[0]]
              if (!winCounts[winner]) {
                winCounts[winner] = 1
              } else {
                winCounts[winner]++
              }
            }
          }
          const winners = Object.keys(winCounts).sort(
            (a, b) => winCounts[b] - winCounts[a],
          )

          return (
            <tr key={index}>
              <td style={{ whiteSpace: "pre" }}>
                {Object.keys(round.parameters)
                  .sort()
                  .map(
                    (p) =>
                      `${p[0].toUpperCase()}${p.slice(1)}: ${round.parameters[p]}`,
                  )
                  .join("\n")}
              </td>
              <td>
                {round.players.map((player, index) => (
                  <img
                    key={index}
                    src={`/images/teams/${player.toLowerCase()}.png`}
                    width={30}
                    style={{ marginInlineEnd: 10 }}
                  />
                ))}
              </td>
              {roundIterations === 1 && (
                <>
                  <td>
                    {results[round.players.join(", ")] !== undefined &&
                      results[round.players.join(", ")][
                        JSON.stringify(round.parameters)
                      ] !== undefined && (
                        <img
                          src={`/images/teams/${round.players[
                            results[round.players.join(", ")][
                              JSON.stringify(round.parameters)
                            ][0].places[0]
                          ]?.toLowerCase()}.png`}
                          width={30}
                          style={{ marginInlineEnd: 10 }}
                        />
                      )}
                  </td>
                  <td>
                    {results[round.players.join(", ")] !== undefined &&
                      results[round.players.join(", ")][
                        JSON.stringify(round.parameters)
                      ] !== undefined && (
                        <img
                          src={`/images/teams/${round.players[
                            results[round.players.join(", ")][
                              JSON.stringify(round.parameters)
                            ][0].places[1]
                          ]?.toLowerCase()}.png`}
                          width={30}
                          style={{ marginInlineEnd: 10 }}
                        />
                      )}
                  </td>
                </>
              )}
              {roundIterations !== 1 && (
                <td>
                  {winners.map((winner, index) => (
                    <p key={index}>
                      {winner}: {winCounts[winner]}
                    </p>
                  ))}
                </td>
              )}
              {actions && <td>{actions(round, index)}</td>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default RoundsTable
