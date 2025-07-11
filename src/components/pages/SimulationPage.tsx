import { Badge, Button, Loader, NumberInput, Slider } from "@mantine/core"
import { useColorScheme } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import React, { useEffect, useState } from "react"
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { useAPIs, useAdmin, useLocalStorage } from "../../hooks"
import {
  downloadFile,
  getLocalStorage,
  getRank,
  setLocalStorage,
  toPlacing,
  tryUntilSuccess,
} from "../../utilities"
import LogViewer from "../LogViewer"

const PlayPauseButton = () => {
  const [playing, setPlaying] = useState(false)
  const [volume] = useLocalStorage<number>({ key: "Volume", defaultValue: 0 })

  useEffect(() => {
    if (window.mainAudio) {
      window.mainAudio.volume = volume
    }
  }, [volume])

  return (
    <Button
      style={{ flex: "none", color: playing ? "black" : "white" }}
      my="xs"
      radius="20px"
      w={100}
      onClick={() => {
        if (!window.mainAudio) {
          const audio = new Audio("/sounds/main.mp3")
          audio.volume = getLocalStorage("Volume", 0)
          audio.loop = true

          window.mainAudio = audio
        }

        if (playing) {
          window.mainAudio?.pause()
        } else {
          window.mainAudio?.play()
        }
        setPlaying((p) => !p)

        // @ts-ignore
        window._playPause()
      }}
      leftSection={
        playing ? (
          <i className="fa-solid fa-pause" />
        ) : (
          <i className="fa-solid fa-play" />
        )
      }
      color={playing ? "yellow.4" : "green"}
      id="playpause"
    >
      {playing ? "Pause" : "Play"}
    </Button>
  )
}

const Simulation = () => {
  const admin = useAdmin()
  const [apis, loading] = useAPIs()
  let { playerapis } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [winner, setWinner] = useState<string>()
  const [downloadBytes, setDownloadBytes] = useState(false)
  const navigate = useNavigate()
  const colorScheme = useColorScheme()
  const showcaseMode = location.search.includes("showcase=true")

  useEffect(() => {
    setLocalStorage("Logs", [])

    // @ts-ignore
    window.showDownload = () => {
      setDownloadBytes(true)
    }

    // @ts-ignore
    window.showWinner = (winner: string, verbose: boolean) => {
      if (admin) {
        setWinner(winner)
        // @ts-ignore
        if (window.audio) {
          // @ts-ignore
          window.audio.pause()
        }
        setTimeout(() => {
          const audio = new Audio("/sounds/nyoooom.mp3")
          audio.volume = getLocalStorage("Volume", 0)
          audio.play()
        }, 700)
      } else {
        notifications.show({
          title: `${winner} won!`,
          message: "They finished in 1st place!",
          color: "green",
          icon: <i className="fa-solid fa-crown" />,
        })
      }
    }
  }, [])

  const parameters = Object.fromEntries(searchParams)
  if (parameters.seed) {
    delete parameters.seed
  }
  playerapis = playerapis?.split("&")[0]

  const playerNames = playerapis?.split(",").map(decodeURIComponent) ?? []

  const players = playerNames.map((api) => (api === "None" ? "" : apis[api]))

  useEffect(() => {
    if (
      !loading &&
      players &&
      playerapis &&
      // @ts-ignore
      window._isSimulationFromFile !== true
    ) {
      const seed = searchParams.get("seed") ?? ""
      tryUntilSuccess(() =>
        // @ts-ignore
        window._startSimulation(
          parameters,
          players,
          playerNames,
          false,
          !showcaseMode,
          true,
          seed,
        ),
      )
    }
  }, [loading])

  const newRank =
    getRank(
      getLocalStorage("Cached tournament/info"),
      winner!,
      getLocalStorage("Point Modifier"),
    ) + 1
  const oldRank =
    getRank(getLocalStorage("Cached tournament/info"), winner!, {}) + 1

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        paddingTop: 10,
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "#000000cc" : "#ffffffcc",
          zIndex: winner === undefined ? -1 : 16,
          opacity: winner === undefined ? 0 : 1,
          transition: "1000ms ease-in-out",
        }}
      >
        <img
          src={`/images/teams/${winner?.toLowerCase()}-side.png`}
          height={100}
          style={{
            transform:
              winner === undefined ? "translateX(-90vw)" : "translateX(70vw)",
            transition: "1400ms cubic-bezier(0.8, 0, 1, 1)",
          }}
        />
        <h1 style={{ fontSize: "8vmin", margin: 0 }}>
          Congratulations, {winner}!
        </h1>
        <h2 style={{ fontSize: "6vmin", margin: 0 }}>
          {
            getLocalStorage("Cached tournament/info")?.teams?.find(
              (t: any) => t.name === winner,
            )?.members
          }
        </h2>
        <h2
          style={{
            fontSize: "4.5vmin",
            margin: 0,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          Now ranked {toPlacing(newRank)}!
          {newRank < oldRank && (
            <Badge color="green" ml="xs" size="xl">
              <i className="fa-solid fa-arrow-up" style={{ marginRight: 5 }} />
              {oldRank - newRank}
            </Badge>
          )}
        </h2>
        <img
          src={`/images/teams/${winner?.toLowerCase()}.png`}
          style={{
            height: winner === undefined ? 200 : 400,
            maxHeight: "40%",
            transition: "1000ms ease-in-out",
          }}
        />
        <Button
          mt="md"
          color="green"
          leftSection={<i className="fa-solid fa-play" />}
          onClick={() => navigate("/round")}
        >
          Continue Round
        </Button>
      </div>

      {loading && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Fetching APIs...</p>
          <Loader />
        </div>
      )}
      {!loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            maxWidth: "100%",
            height: "100%",
            maxHeight: "100%",
          }}
        >
          <div style={{ flexGrow: 1, textAlign: "center" }}>
            {!location.search.includes("background=true") && (
              <>
                <div style={{ textAlign: "center", flexGrow: 1 }}>
                  {showcaseMode || (
                    <>
                      <span id="render-status" style={{ marginRight: 10 }} />
                      <NumberInput
                        id="breakpoint"
                        label="Breakpoint"
                        min={0}
                        leftSection={<i className="fa-solid fa-stopwatch" />}
                        display="inline-block"
                        maw="35%"
                        mr="xs"
                      />
                      <Button
                        style={{ flex: "none" }}
                        my="xs"
                        w={100}
                        leftSection={<i className="fa-solid fa-wand-magic" />}
                        color={"grape"}
                        id="step"
                        mr="xs"
                        radius="20px"
                        // @ts-ignore
                        onClick={() => window._step()}
                      >
                        Step
                      </Button>
                    </>
                  )}
                  <PlayPauseButton />
                  {downloadBytes && (
                    <Button
                      ml="xs"
                      radius="20px"
                      leftSection={<i className="fa-solid fa-download" />}
                      color="blue"
                      onClick={() =>
                        downloadFile(
                          `${playerNames.join("-")}.btl`,
                          "text/plain",
                          // @ts-ignore
                          window.simulationToDownload,
                        )
                      }
                    >
                      Download
                    </Button>
                  )}
                </div>
                {showcaseMode && <span id="render-status" />}
                <p style={{ margin: 0 }}>Playback Speed</p>
                <Slider
                  style={{ flex: "none" }}
                  mb={30}
                  w={500}
                  maw="85%"
                  min={-2}
                  defaultValue={0}
                  marks={[
                    { value: -2, label: "1/4" },
                    { value: -1, label: "1/2" },
                    { value: 0, label: "1" },
                    { value: 1, label: "2" },
                    { value: 2, label: "4" },
                    { value: 3, label: "8" },
                    { value: 4, label: "16" },
                    { value: 5, label: "32" },
                    { value: 6, label: "64" },
                  ]}
                  max={6}
                  step={0.05}
                  mx="auto"
                  id="timescale"
                  label={(n) => Math.round(Math.pow(2, n) * 100) / 100}
                />
              </>
            )}
            <div
              id="loader"
              style={{
                width: "100%",
                height: "70%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p id="loadingText">Initializing simulator...</p>
              <Loader />
            </div>
            <canvas id="simulation" style={{ borderRadius: 10 }} />
          </div>

          {!showcaseMode && (
            <div
              style={{
                flex: "none",
                width: 400,
                padding: 10,
                maxHeight: "90%",
              }}
            >
              <LogViewer playerNames={playerNames} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Simulation

