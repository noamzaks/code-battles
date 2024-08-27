import { Button } from "@mantine/core"
import React from "react"

interface Props {
  playerNames: string[]
  showLogs: boolean[]
  setShowLogs: (newValue: boolean[]) => void
}

const ShowLogsButtons: React.FC<Props> = ({
  playerNames,
  showLogs,
  setShowLogs,
}) => {
  return (
    <Button.Group mb="xs">
      {playerNames.map((name, index) => (
        <Button
          key={index}
          style={{ width: 100 / playerNames.length + "%" }}
          leftSection={
            showLogs[index] ? (
              <i className="fa-solid fa-check" />
            ) : (
              <i className="fa-solid fa-xmark" />
            )
          }
          onClick={() => {
            showLogs[index] = !showLogs[index]
            setShowLogs([...showLogs])
          }}
        >
          {name}
        </Button>
      ))}
    </Button.Group>
  )
}

export default ShowLogsButtons
