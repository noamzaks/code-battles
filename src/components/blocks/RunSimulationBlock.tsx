import { Button, Select } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useConfiguration } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"
import { getLocalStorage, runNoUI, setLocalStorage } from "../../utilities"
import Block from "./Block"
import BotSelector from "./BotSelector"

const RunSimulationBlock = () => {
  const [apis, loading] = useAPIs()
  const configuration = useConfiguration()
  const [map, setMap] = useLocalStorage<string>({
    key: "Map",
    defaultValue: configuration.maps[0],
  })
  const [playerCount, setPlayerCount] = useLocalStorage<number>({
    key: "Player Count",
    defaultValue: 2,
  })
  const [playerBots, setPlayerBots] = useLocalStorage<string[]>({
    key: "Player Bots",
    defaultValue: ["None", "None"],
  })
  const [runningNoUI, setRunningNoUI] = useState(false)
  const [runningNoUIN, setRunningNoUIN] = useState<Record<string, number>>({})
  const navigate = useNavigate()

  let remaining = 0
  if (Object.keys(runningNoUIN).length === 1) {
    remaining = Math.max(...Object.values(runningNoUIN))
  }

  const run = () => {
    navigate(`/simulation/${map.replaceAll(" ", "-")}/${playerBots.join("-")}`)
  }

  const startRunNoUI = () => {
    setRunningNoUI(true)
    runNoUI(map, apis, playerBots, true)
  }

  const startRunNoUIN = (n: number) => {
    setRunningNoUIN({ [n.toString()]: n })
    runNoUI(map, apis, playerBots, false)
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

  useEffect(() => {
    for (const key in runningNoUIN) {
      if (runningNoUIN[key] == 0) {
        const results = getLocalStorage("Results")
        const currentResults = results[playerBots.join(", ")][map]
        const winCounts: Record<string, number> = {}
        for (const result of currentResults) {
          const winner = playerBots[result[0]]
          if (!winCounts[winner]) {
            winCounts[winner] = 1
          } else {
            winCounts[winner]++
          }
        }
        const winners = Object.keys(winCounts).sort(
          (a, b) => winCounts[b] - winCounts[a]
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
        setLocalStorage("Results", {})
      } else {
        runNoUI(map, apis, playerBots, false)
      }
    }
  }, [runningNoUIN])

  return (
    <Block title="Run Simulation" logo="fa-solid fa-display">
      <Select
        leftSection={<i className="fa-solid fa-earth-americas" />}
        label="Map"
        data={configuration.maps}
        value={map}
        onChange={(s) => {
          if (s) {
            setMap(s)
          }
        }}
      />
      <BotSelector
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
        playerBots={playerBots}
        setPlayerBots={setPlayerBots}
        apis={apis}
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
    </Block>
  )
}

export default RunSimulationBlock
