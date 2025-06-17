import React, { useEffect } from "react"
import { useLocalStorage } from "../hooks"
import { getLocalStorage } from "../utilities"
import AutoScrollButton from "./AutoScrollButton"
import ShowLogsButtons from "./ShowLogsButtons"

interface Props {
  playerNames: string[]
}

interface Log {
  playerIndex: number
  text: string
  color: string
}

const LogViewer: React.FC<Props> = ({ playerNames }) => {
  const [showLogs, setShowLogs] = useLocalStorage<boolean[]>({
    key: "Show Logs",
    defaultValue: [],
  })
  const [logs, setLogs] = useLocalStorage<Log[]>({
    key: "Logs",
    defaultValue: [],
  })

  useEffect(() => {
    setShowLogs(playerNames.map(() => true))
  }, [playerNames])

  useEffect(() => {
    // @ts-ignore
    window.consoleLog = (playerIndex: number, text: string, color: string) => {
      // @ts-ignore
      const con = document.getElementById("console")
      if (con) {
        setLogs((l) => [...l, { playerIndex, text, color }])
      }
    }
  }, [])

  useEffect(() => {
    const con = document.getElementById("console")
    if (con && getLocalStorage("Auto Scroll", true)) {
      con.scrollTop = con.scrollHeight
    }
  }, [logs])

  return (
    <>
      <h1 style={{ color: "white", textAlign: "center", margin: 0 }}>
        Console
      </h1>
      <AutoScrollButton />
      <ShowLogsButtons
        playerNames={playerNames}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
      />

      <div id="console">
        {logs
          .filter((log) => log.playerIndex === -1 || showLogs[log.playerIndex])
          .map((log, index) => (
            <p key={index} color={log.color}>
              {log.text}
            </p>
          ))}
      </div>
    </>
  )
}

export default LogViewer

