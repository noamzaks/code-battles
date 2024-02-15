import { Button, Select } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useConfiguration } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"
import { runNoUI } from "../../utilities"
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
  const navigate = useNavigate()

  const run = () => {
    navigate(`/simulation/${map.replaceAll(" ", "-")}/${playerBots.join("-")}`)
  }

  const startRunNoUI = () => {
    if (loading) {
      console.error("Loading APIs, cannot run simulation yet!")
      return
    }
    setRunningNoUI(true)
    runNoUI(map, apis, playerBots)
  }

  useEffect(() => {
    // @ts-ignore
    window.showWinner = (winner: string) => {
      notifications.show({
        title: `${winner} won!`,
        message: "They finished in 1st place!",
        color: "green",
        icon: <i className="fa-solid fa-crown" />,
      })
      setRunningNoUI(false)
    }
  }, [])

  return (
    <Block title="Run Simulation" logo="fa-solid fa-display">
      <Select
        icon={<i className="fa-solid fa-earth-americas" />}
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
          leftIcon={<i className="fa-solid fa-play" />}
          onClick={run}
        >
          Run
        </Button>
        <Button
          variant="default"
          w="50%"
          leftIcon={<i className="fa-solid fa-forward" />}
          onClick={startRunNoUI}
          loading={runningNoUI}
        >
          Run (No UI)
        </Button>
      </Button.Group>
      <p style={{ textAlign: "center", display: "none" }} id="noui-progress" />
    </Block>
  )
}

export default RunSimulationBlock
