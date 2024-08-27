import { NumberInput, Select } from "@mantine/core"
import React from "react"

interface Props {
  playerCount: number
  setPlayerCount: React.Dispatch<React.SetStateAction<number>>
  playerBots: string[]
  setPlayerBots: React.Dispatch<React.SetStateAction<string[]>>
  apis: any[]
}

const BotSelector: React.FC<Props> = ({
  playerCount,
  setPlayerCount,
  playerBots,
  setPlayerBots,
  apis,
}) => {
  return (
    <>
      <NumberInput
        mt="xs"
        label="Player Count"
        value={playerCount}
        min={1}
        onChange={(c) => {
          if (typeof c === "number") {
            setPlayerCount(c)
            while (playerBots.length < c) {
              playerBots.push("None")
            }
            while (playerBots.length > c) {
              playerBots.pop()
            }
            setPlayerBots([...playerBots])
          }
        }}
        leftSection={<i className="fa-solid fa-user-group" />}
      />

      {Array.from(Array(playerCount).keys()).map((_, index) => (
        <Select
          key={index}
          mt="xs"
          leftSection={<i className="fa-solid fa-robot" />}
          label={`Player ${index + 1} Bot`}
          value={playerBots[index]}
          onChange={(api) => {
            if (api) {
              playerBots[index] = api
              setPlayerBots([...playerBots])
            }
          }}
          data={["None", ...Object.keys(apis).sort()]}
        />
      ))}
    </>
  )
}

export default BotSelector
