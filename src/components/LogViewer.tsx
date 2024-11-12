import React, { useEffect } from "react"
import AutoScrollButton from "./AutoScrollButton"
import ShowLogsButtons from "./ShowLogsButtons"
import { useLocalStorage } from "../hooks"

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
        // @ts-ignore
        if (window.autoScroll) {
          con.scrollTop = con.scrollHeight
        }
      }
    }
  }, [])

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

      <div
        id="console"
        style={{
          whiteSpace: "pre",
          fontFamily: "Ubuntu Mono",
          backgroundColor: "#111",
          borderRadius: 20,
          width: "100%",
          height: "95%",
          maxHeight: "calc(100% - 80px)",
          overflow: "auto",
          padding: 10,
        }}
      >
        {logs
          .filter((log) => log.playerIndex === -1 || showLogs[log.playerIndex])
          .map((log, index) => (
            <p key={index} style={{ margin: 0, color: log.color }}>
              {log.text}
            </p>
          ))}
      </div>
    </>
  )
}

export default LogViewer
