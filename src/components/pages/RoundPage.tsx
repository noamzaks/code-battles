import { Button, NumberInput, Select } from "@mantine/core"
import { Dropzone } from "@mantine/dropzone"
import { useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { deleteField, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfiguration, useFirestore } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"

import {
  RoundInfo,
  runNoUI,
  setLocalStorage,
  updatePointModifier,
} from "../../utilities"
import Block from "../blocks/Block"
import BotSelector from "../blocks/BotSelector"
import TournamentBlock from "../blocks/TournamentBlock"
import ResultStatisticsTable from "../ResultStatisticsTable"
import ResultWinnerChart from "../ResultWinnerChart"
import RoundsTable from "../RoundsTable"

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
    const showWinner = (winner: string, verbose: boolean) => {
      setRunningNoUIN((runningNoUIN) => {
        const newRunningNoUIN: Record<string, number> = {}
        for (const key in runningNoUIN) {
          newRunningNoUIN[key] = runningNoUIN[key] - 1
        }

        return newRunningNoUIN
      })
    }
    // @ts-ignore
    window.showWinner = showWinner

    return () => {
      // @ts-ignore
      if (window.showWinner === showWinner) {
        // @ts-ignore
        delete window.showWinner
      }
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

  const loadRoundsFromFile = async (file: File) => {
    try {
      const fileRounds: {
        parameters?: Record<string, string>
        bots: string[]
      }[] = JSON.parse(await file.text())
      setRounds(
        fileRounds.map((round) => {
          const roundParameters: Record<string, string> = {}
          for (const key in configuration.parameters) {
            roundParameters[key] =
              round.parameters?.[key] ?? configuration.parameters[key][0]
          }
          return { players: round.bots, parameters: roundParameters }
        }),
      )
      notifications.show({
        title: "Rounds loaded",
        message: `Loaded ${fileRounds.length} rounds from ${file.name}.`,
        color: "green",
        icon: <i className="fa-solid fa-check" />,
      })
    } catch (e) {
      notifications.show({
        title: "Failed to load rounds",
        message: `${e}`,
        color: "red",
        icon: <i className="fa-solid fa-xmark" />,
      })
    }
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
            <ResultWinnerChart />
            <RoundsTable
              rounds={rounds}
              results={results}
              roundIterations={roundIterations}
              actions={(round, index) => (
                <Button.Group orientation="vertical">
                  <Button
                    leftSection={<i className="fa-solid fa-hand-pointer" />}
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
              )}
            />
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
                <Dropzone
                  mt="xs"
                  multiple={false}
                  accept={["application/json"]}
                  onDrop={(files) => {
                    if (files.length === 1) {
                      loadRoundsFromFile(files[0])
                    }
                  }}
                  style={{
                    textAlign: "center",
                    paddingTop: 20,
                    paddingBottom: 20,
                    paddingLeft: 10,
                    paddingRight: 10,
                  }}
                >
                  <span>
                    <i
                      className="fa-solid fa-file-code"
                      style={{ marginRight: 10 }}
                    />
                    Drag a JSON file here or click to select a file to set the
                    rounds
                  </span>
                </Dropzone>

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
                <Button
                  leftSection={<i className="fa-solid fa-cloud-arrow-up" />}
                  mt="xs"
                  onClick={async () => {
                    await updateDoc(doc(firestore, "/tournament/info"), {
                      round: {
                        rounds: JSON.stringify(rounds),
                        results: JSON.stringify(results),
                        roundIterations,
                      },
                    })
                    notifications.show({
                      title: "Round published",
                      message: "Everyone can now see the round.",
                      color: "green",
                      icon: <i className="fa-solid fa-check" />,
                    })
                  }}
                  style={{ width: "47.5%", marginRight: "5%" }}
                >
                  Publish Round
                </Button>
                <Button
                  color="red"
                  leftSection={<i className="fa-solid fa-cloud" />}
                  mt="xs"
                  onClick={async () => {
                    await updateDoc(doc(firestore, "/tournament/info"), {
                      round: deleteField(),
                    })
                    notifications.show({
                      title: "Round unpublished",
                      message: "The round is no longer visible.",
                      color: "green",
                      icon: <i className="fa-solid fa-check" />,
                    })
                  }}
                  style={{ width: "47.5%" }}
                >
                  Unpublish Round
                </Button>
              </>
            )}
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
          <ResultStatisticsTable />
        </div>
      </div>
    </>
  )
}

export default Round
