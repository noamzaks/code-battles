import { Button, NumberInput, Select } from "@mantine/core"
import { Dropzone } from "@mantine/dropzone"
import { notifications } from "@mantine/notifications"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useConfiguration } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"
import { runNoUI, setLocalStorage, tryUntilSuccess } from "../../utilities"
import ResultWinnerChart from "../ResultWinnerChart"
import Block from "./Block"
import BotSelector from "./BotSelector"

const RunSimulationBlock = () => {
  const [apis, loading] = useAPIs()
  const configuration = useConfiguration()
  const [parameters, setParameters] = useLocalStorage<Record<string, string>>({
    key: "Parameters",
    defaultValue: {},
  })

  const [playerCount, setPlayerCount] = useLocalStorage<number>({
    key: "Player Count",
    defaultValue: 2,
  })
  const [playerBots, setPlayerBots] = useLocalStorage<string[]>({
    key: "Player Bots",
    defaultValue: ["None", "None"],
  })
  const [seed, setSeed] = useLocalStorage<number | string>({
    key: "Seed",
    defaultValue: "",
  })
  const [runningNoUI, setRunningNoUI] = useState(false)
  const [runningNoUIN, setRunningNoUIN] = useState<Record<string, number>>({})
  const navigate = useNavigate()
  const [results] = useLocalStorage<any>({
    key: "Results",
    defaultValue: {},
  })

  let remaining = 0
  if (Object.keys(runningNoUIN).length === 1) {
    remaining = Math.max(...Object.values(runningNoUIN))
  }

  const getFullParameters = () => {
    const result: Record<string, string> = {}
    for (const key in configuration.parameters) {
      result[key] = parameters[key] ?? configuration.parameters[key][0]
    }
    return result
  }

  const run = () => {
    // @ts-ignore
    window._isSimulationFromFile = false
    const params = getFullParameters()
    navigate(
      `/simulation/${playerBots.map(encodeURIComponent).join(",")}?seed=${
        seed === "-" ? "" : seed
      }&${Object.keys(params)
        .map((p) => `${p}=${encodeURIComponent(params[p])}`)
        .join("&")}`,
    )
  }

  const startRunNoUI = () => {
    setRunningNoUI(true)
    runNoUI(getFullParameters(), apis, playerBots, seed.toString(), true)
  }

  const startRunNoUIN = (n: number) => {
    setLocalStorage("Results", {})
    setRunningNoUIN({ [n.toString()]: n })
    runNoUI(getFullParameters(), apis, playerBots, seed.toString(), false)
  }

  useEffect(() => {
    // @ts-ignore
    window.showWinner = (winner: string, verbose: boolean) => {
      if (verbose) {
        notifications.show({
          title: `${winner} won!`,
          message: "They finished in 1st place!",
          color: "green",
          icon: <i className="fa-solid fa-crown" />,
        })
        setRunningNoUI(false)
      } else {
        setRunningNoUIN((runningNoUIN) => {
          const newRunningNoUIN: Record<string, number> = {}
          for (const key in runningNoUIN) {
            newRunningNoUIN[key] = runningNoUIN[key] - 1
          }

          return newRunningNoUIN
        })
      }
    }
  }, [])

  const currentResults = ((results ?? {})[playerBots.join(", ")] ?? {})[
    JSON.stringify(getFullParameters())
  ]

  useEffect(() => {
    for (const key in runningNoUIN) {
      if (runningNoUIN[key] == 0) {
        const winCounts: Record<string, number> = {}
        for (const result of currentResults) {
          const winner = playerBots[result.places[0]]
          if (!winCounts[winner]) {
            winCounts[winner] = 1
          } else {
            winCounts[winner]++
          }
        }
        const winners = Object.keys(winCounts).sort(
          (a, b) => winCounts[b] - winCounts[a],
        )
        notifications.show({
          title: `Result of ${key} matches`,
          message: (
            <>
              {winners.map((winner, index) => (
                <p key={index}>
                  {winner}: {winCounts[winner]}
                </p>
              ))}
            </>
          ),
          color: "green",
          icon: <i className="fa-solid fa-crown" />,
          autoClose: false,
        })
      } else {
        runNoUI(getFullParameters(), apis, playerBots, seed.toString(), false)
      }
    }
  }, [runningNoUIN])

  return (
    <Block title="Run Simulation" logo="fa-solid fa-display">
      {Object.keys(configuration.parameters)
        .sort()
        .map((parameter, parameterIndex) => {
          const icon = (configuration.parameterIcons ?? {})[parameter]
          return (
            <Select
              mb="xs"
              key={parameterIndex}
              leftSection={icon ? <i className={icon} /> : undefined}
              label={parameter[0].toUpperCase() + parameter.slice(1)}
              data={configuration.parameters[parameter]}
              value={
                parameters[parameter] ?? configuration.parameters[parameter][0]
              }
              onChange={(s) =>
                setParameters({
                  ...parameters,
                  [parameter]: s ?? configuration.parameters[parameter][0],
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
      <NumberInput
        mt="xs"
        leftSection={<i className="fa-solid fa-dice" />}
        label="Randomness Seed"
        min={0}
        value={seed}
        onChange={setSeed}
      />

      <Button.Group mt="xs">
        <Button
          variant="default"
          w="50%"
          leftSection={<i className="fa-solid fa-play" />}
          onClick={run}
        >
          Run
        </Button>
        <Button
          variant="default"
          w="50%"
          leftSection={<i className="fa-solid fa-forward" />}
          onClick={startRunNoUI}
          loading={runningNoUI || loading}
        >
          Run (No UI)
        </Button>
      </Button.Group>
      {configuration.runningCountOptions !== undefined && (
        <Button.Group mt="xs">
          {configuration.runningCountOptions.map((count, index) => (
            <Button
              key={index}
              variant="default"
              w={100 / configuration.runningCountOptions!.length + "%"}
              leftSection={<i className="fa-solid fa-forward-fast" />}
              onClick={() => startRunNoUIN(count)}
              loading={runningNoUIN[count] > 0 || loading}
            >
              Run {count}
            </Button>
          ))}
        </Button.Group>
      )}
      {remaining !== 0 && (
        <p style={{ textAlign: "center", marginTop: 10 }}>
          Remaining Simulations: {remaining}
        </p>
      )}
      <p
        style={{ textAlign: "center", display: "none", marginTop: 10 }}
        id="noui-progress"
      />
      <ResultWinnerChart results={currentResults} players={playerBots} />
      <Dropzone
        mt="xs"
        multiple={false}
        onDrop={async (files) => {
          if (files.length !== 1) {
            return
          }

          const file = files[0]
          const text = await file.text()
          // @ts-ignore
          window._navigate = navigate
          // @ts-ignore
          window._isSimulationFromFile = true

          tryUntilSuccess(() => {
            // @ts-ignore
            window._startSimulationFromFile(text)
          })
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
          <i className="fa-solid fa-file-code" style={{ marginRight: 10 }} />
          Drag a simulation file here or click to select a file to run a
          simulation from a file
        </span>
      </Dropzone>
    </Block>
  )
}

export default RunSimulationBlock

