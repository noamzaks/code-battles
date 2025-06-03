import { Button, NumberInput, Select } from "@mantine/core"
import { useViewportSize } from "@mantine/hooks"
import { doc, getDoc, setDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfiguration, useFirestore } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"

import {
  RoundInfo,
  runNoUI,
  setLocalStorage,
  shuffle,
  updatePointModifier,
} from "../../utilities"
import Block from "../blocks/Block"
import BotSelector from "../blocks/BotSelector"
import TournamentBlock from "../blocks/TournamentBlock"
import ResultStatisticsTable from "../ResultStaticsTable"

let currentParameters: Record<string, string>
let currentPlayers: string[]

const Round = () => {
  const firestore = useFirestore()
  const configuration = useConfiguration()
  const location = useLocation()
  const navigate = useNavigate()
  const [apis, loadingAPIs] = useAPIs()
  const [playerCount, setPlayerCount] = useLocalStorage<number>({
    key: "Player Count",
    defaultValue: 2,
  })
  const [playerBots, setPlayerBots] = useLocalStorage<string[]>({
    key: "Player Bots",
    defaultValue: ["None", "None"],
  })
  const [parameters, setParameters] = useLocalStorage<Record<string, string>>({
    key: "Parameters",
    defaultValue: {},
  })
  const [rounds, setRounds] = useLocalStorage<RoundInfo[]>({
    key: "Rounds",
    defaultValue: [],
  })
  const [roundIterations, setRoundIterations] = useLocalStorage<number>({
    key: "Round Iterations",
    defaultValue: 1,
  })

  const [results, setResults] = useLocalStorage<any>({
    key: "Results",
    defaultValue: {},
  })
  const [pointModifier] = useLocalStorage<Record<string, number>>({
    key: "Point Modifier",
  })
  const { width: clientWidth } = useViewportSize()
  const [runningNoUIN, setRunningNoUIN] = useState<Record<string, number>>({})

  const startRunNoUIN = (n: number) => {
    setRunningNoUIN({ [n.toString()]: n })
  }

  useEffect(() => {
    // @ts-ignore
    window.showWinner = (winner: string, verbose: boolean) => {
      setRunningNoUIN((runningNoUIN) => {
        const newRunningNoUIN: Record<string, number> = {}
        for (const key in runningNoUIN) {
          newRunningNoUIN[key] = runningNoUIN[key] - 1
        }

        return newRunningNoUIN
      })
    }
  }, [])

  let remaining = 0
  if (Object.keys(runningNoUIN).length > 0) {
    remaining = Math.max(...Object.values(runningNoUIN))
  }

  useEffect(() => {
    if (remaining > 0) {
      runNoUI(currentParameters, apis, currentPlayers, "", false)
    }
  }, [remaining])

  const getFullParameters = () => {
    const result: Record<string, string> = {}
    for (const key in configuration.parameters) {
      result[key] = parameters[key] ?? configuration.parameters[key][0]
    }
    return result
  }

  useEffect(updatePointModifier, [results])

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <div style={{ width: 800, maxWidth: "95%", padding: 10 }}>
          <Block title="Round" logo="fa-solid fa-otter">
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
                  {roundIterations !== 1 && (
                    <th style={{ width: "35%" }}>Results</th>
                  )}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round, index) => {
                  const winCounts: Record<string, number> = {}
                  if (results[round.players.join(", ")] !== undefined) {
                    const currentResults =
                      results[round.players.join(", ")][
                        JSON.stringify(round.parameters)
                      ]
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
                                    ][0][0]
                                  ].toLowerCase()}.png`}
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
                                    ][0][1]
                                  ].toLowerCase()}.png`}
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
                      <td>
                        <Button.Group orientation="vertical">
                          <Button
                            leftSection={
                              <i className="fa-solid fa-hand-pointer" />
                            }
                            size="xs"
                            onClick={() => {
                              setLocalStorage("Current Round", index)
                            }}
                          >
                            Select
                          </Button>
                          <Button
                            leftSection={<i className="fa-solid fa-play" />}
                            size="xs"
                            onClick={() =>
                              navigate(
                                `/simulation/${round.players.map(encodeURIComponent).join(",")}?showcase=true&${Object.keys(
                                  round.parameters,
                                )
                                  .map(
                                    (p) =>
                                      `${p}=${encodeURIComponent(round.parameters[p])}`,
                                  )
                                  .join("&")}`,
                              )
                            }
                          >
                            Simulate
                          </Button>
                          <Button
                            leftSection={<i className="fa-solid fa-forward" />}
                            size="xs"
                            onClick={() => {
                              if (roundIterations === 1) {
                                runNoUI(
                                  round.parameters,
                                  apis,
                                  round.players,
                                  "",
                                  false,
                                )
                              } else {
                                currentParameters = round.parameters
                                currentPlayers = round.players
                                startRunNoUIN(roundIterations)
                              }
                            }}
                          >
                            Simulate (No UI)
                          </Button>
                        </Button.Group>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p
              style={{ textAlign: "center", display: "none" }}
              id="noui-progress"
            />
            {remaining > 0 && (
              <p style={{ textAlign: "center", marginTop: 10 }}>
                Remaining Simulations: {remaining}
              </p>
            )}
            {location.search.includes("edit") && (
              <>
                <NumberInput
                  mb="xs"
                  value={roundIterations}
                  onChange={(v) =>
                    setRoundIterations(parseInt(v.toString(), 10) ?? 1)
                  }
                  label="Round Iterations"
                  leftSection={<i className="fa-solid fa-hashtag" />}
                />
                {Object.keys(configuration.parameters)
                  .sort()
                  .map((parameter, parameterIndex) => {
                    const icon = (configuration.parameterIcons ?? {})[parameter]
                    return (
                      <Select
                        key={parameterIndex}
                        mb="xs"
                        leftSection={icon ? <i className={icon} /> : undefined}
                        label={parameter[0].toUpperCase() + parameter.slice(1)}
                        data={configuration.parameters[parameter]}
                        value={
                          parameters[parameter] ??
                          configuration.parameters[parameter][0]
                        }
                        onChange={(s) =>
                          setParameters({
                            ...parameters,
                            [parameter]:
                              s ?? configuration.parameters[parameter][0],
                          })
                        }
                      />
                    )
                  })}
                <BotSelector
                  playerCount={playerCount}
                  setPlayerCount={setPlayerCount}
                  playerBots={playerBots}
                  setPlayerBots={setPlayerBots}
                  apis={apis}
                />
                <Button
                  color="red"
                  leftSection={<i className="fa-solid fa-trash" />}
                  mt="xs"
                  onClick={() => {
                    setRounds([])
                    setResults({})
                  }}
                  style={{ width: "30%", marginRight: "5%" }}
                >
                  Clear
                </Button>
                <Button
                  color="red"
                  leftSection={<i className="fa-solid fa-refresh" />}
                  mt="xs"
                  onClick={() => {
                    setResults({})
                  }}
                  style={{ width: "30%", marginRight: "5%" }}
                >
                  Clear Results
                </Button>
                <Button
                  leftSection={<i className="fa-solid fa-plus" />}
                  mt="xs"
                  onClick={() => {
                    setRounds((rounds) => [
                      ...rounds,
                      {
                        players: playerBots,
                        parameters: { ...getFullParameters() },
                      },
                    ])
                  }}
                  style={{ width: "30%" }}
                >
                  Add
                </Button>

                <Button
                  leftSection={<i className="fa-solid fa-save" />}
                  fullWidth
                  mt="xs"
                  onClick={async () => {
                    const info = doc(firestore, "/tournament/info")
                    const d = await getDoc(info)
                    const data: any = d.data()
                    for (const team in pointModifier) {
                      data.teams.find((t: any) => t.name === team).points +=
                        pointModifier[team]
                    }
                    await setDoc(info, data)
                  }}
                >
                  Save Scores
                </Button>
              </>
            )}
            <Button
              leftSection={<i className="fa-solid fa-dice" />}
              mt="xs"
              fullWidth
              variant="white"
              onClick={async () => {
                for (const timeout of [
                  400, 300, 300, 200, 200, 200, 200, 200, 100, 100, 100, 100,
                  100, 100, 100, 100, 100, 100, 100, 80, 80, 80, 80, 80, 80, 80,
                  80, 80, 80, 80,
                ]) {
                  setRounds((rounds) =>
                    rounds.map((round) => ({
                      parameters: round.parameters,
                      players: shuffle(round.players),
                    })),
                  )
                  await new Promise((resolve) => setTimeout(resolve, timeout))
                }
              }}
            >
              Shuffle
            </Button>
          </Block>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: clientWidth >= 700 ? "row" : "column",
            }}
          >
            <TournamentBlock title="Before" inline />
            <TournamentBlock
              title="After"
              inline
              pointModifier={pointModifier}
            />
          </div>
        </div>
        <ResultStatisticsTable />
      </div>
    </>
  )
}

export default Round

