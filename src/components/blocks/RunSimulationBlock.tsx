import { Button, Select } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useConfiguration } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"
import * as pyscript from "../../pyscript"
import Block from "./Block"
import BotSelector from "./BotSelector"

const RunSimulationBlock = () => {
  const [apis, loading] = useAPIs()
  const [map, setMap] = useLocalStorage<string>({
    key: "Map",
    defaultValue: "Cards",
  })
  const [playerCount, setPlayerCount] = useLocalStorage<number>({
    key: "Player Count",
    defaultValue: 2,
  })
  const [playerAPIs, setPlayerAPIs] = useLocalStorage<string[]>({
    key: "Player APIs",
    defaultValue: ["None", "None"],
  })
  const [runningNoUI, setRunningNoUI] = useState(false)
  const configuration = useConfiguration()
  const navigate = useNavigate()

  const run = () => {
    navigate(`/simulation/${map.replaceAll(" ", "-")}/${playerAPIs.join("-")}`)
  }

  const runNoUI = () => {
    if (loading) {
      console.error("Loading APIs, cannot run simulation yet!")
      return
    }
    setRunningNoUI(true)
    const players = playerAPIs.map((api) => (api === "None" ? "" : apis[api]))
    pyscript.run(
      `run_noui_simulation("${map}", ${JSON.stringify(
        players
      )}, ${JSON.stringify(playerAPIs)})`
    )
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
        icon={<i className="fa-solid fa-map" />}
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
        playerAPIs={playerAPIs}
        setPlayerAPIs={setPlayerAPIs}
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
          onClick={runNoUI}
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
