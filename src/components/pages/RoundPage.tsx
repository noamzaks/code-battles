import { Button, Select } from "@mantine/core"
import { doc, getDoc, setDoc } from "firebase/firestore"
import React, { useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Particles from "react-tsparticles"
import { loadFull } from "tsparticles"
import { useConfiguration, useFirestore } from "../../configuration"
import { useAPIs, useLocalStorage } from "../../hooks"
import { parallax } from "../../particles"
import {
  RoundInfo,
  getLocalStorage,
  setLocalStorage,
  shuffle,
  updatePointModifier,
} from "../../utilities"
import Block from "../blocks/Block"
import BotSelector from "../blocks/BotSelector"
import TournamentBlock from "../blocks/TournamentBlock"

const Round = () => {
  const firestore = useFirestore()
  const configuration = useConfiguration()
  const location = useLocation()
  const navigate = useNavigate()
  const [apis] = useAPIs()
  const [playerCount, setPlayerCount] = useLocalStorage<number>({
    key: "Player Count",
    defaultValue: 2,
  })
  const [playerBots, setPlayerBots] = useLocalStorage<string[]>({
    key: "Player Bots",
    defaultValue: ["None", "None"],
  })
  const [map, setMap] = useLocalStorage<string>({
    key: "Map",
    defaultValue: "Cards",
  })
  const [rounds, setRounds] = useLocalStorage<RoundInfo[]>({
    key: "Rounds",
    defaultValue: [],
  })
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine)
  }, [])

  const results = getLocalStorage("Results", {})
  const pointModifier: Record<string, number> =
    getLocalStorage("Point Modifier")

  useEffect(updatePointModifier, [])

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
                  <th style={{ width: "25%" }}>Map</th>
                  <th style={{ width: "35%" }}>Players</th>
                  <th style={{ width: "17.5%" }}>1st Place</th>
                  <th style={{ width: "17.5%" }}>2nd Place</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round, index) => {
                  return (
                    <tr key={index}>
                      <td>{round.map}</td>
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
                      <td>
                        {results[round.players.join(", ")] !== undefined &&
                          results[round.players.join(", ")][round.map] !==
                            undefined && (
                            <img
                              src={`/images/teams/${round.players[
                                results[round.players.join(", ")][round.map][0]
                              ].toLowerCase()}.png`}
                              width={30}
                              style={{ marginInlineEnd: 10 }}
                            />
                          )}
                      </td>
                      <td>
                        {results[round.players.join(", ")] !== undefined &&
                          results[round.players.join(", ")][round.map] !==
                            undefined && (
                            <img
                              src={`/images/teams/${round.players[
                                results[round.players.join(", ")][round.map][1]
                              ].toLowerCase()}.png`}
                              width={30}
                              style={{ marginInlineEnd: 10 }}
                            />
                          )}
                      </td>
                      <td>
                        <Button
                          leftIcon={<i className="fa-solid fa-play" />}
                          compact
                          onClick={() =>
                            navigate(
                              `/simulation/${round.map.replaceAll(
                                " ",
                                "-"
                              )}/${round.players.join("-")}`
                            )
                          }
                        >
                          Simulate
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {location.search.includes("edit") && (
              <>
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
                  playerBots={playerBots}
                  setPlayerBots={setPlayerBots}
                  apis={apis}
                />
                <Button
                  color="red"
                  leftIcon={<i className="fa-solid fa-trash" />}
                  mt="xs"
                  onClick={() => {
                    setRounds([])
                    setLocalStorage("Results", {})
                  }}
                  style={{ width: "45%", marginRight: "10%" }}
                >
                  Clear
                </Button>
                <Button
                  leftIcon={<i className="fa-solid fa-plus" />}
                  mt="xs"
                  onClick={() => {
                    setRounds((rounds) => [
                      ...rounds,
                      { players: playerBots, map },
                    ])
                  }}
                  style={{ width: "45%" }}
                >
                  Add
                </Button>

                <Button
                  leftIcon={<i className="fa-solid fa-save" />}
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
              leftIcon={<i className="fa-solid fa-dice" />}
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
                      map: round.map,
                      players: shuffle(round.players),
                    }))
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
              flexDirection:
                document.body.clientWidth >= 700 ? "row" : "column",
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
      </div>
      <div
        style={{
          zIndex: -10,
        }}
      >
        <Particles init={particlesInit} options={parallax} />
      </div>
    </>
  )
}

export default Round
