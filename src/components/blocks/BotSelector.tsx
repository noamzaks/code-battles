import { NumberInput, Select } from "@mantine/core"
import React from "react"

interface Props {
  playerCount: number
  setPlayerCount: React.Dispatch<React.SetStateAction<number>>
  playerAPIs: string[]
  setPlayerAPIs: React.Dispatch<React.SetStateAction<string[]>>
  apis: any[]
}

const BotSelector: React.FC<Props> = ({
  playerCount,
  setPlayerCount,
  playerAPIs,
  setPlayerAPIs,
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
          if (c) {
            setPlayerCount(c)
            while (playerAPIs.length < c) {
              playerAPIs.push("None")
            }
            while (playerAPIs.length > c) {
              playerAPIs.pop()
            }
            setPlayerAPIs([...playerAPIs])
          }
        }}
        icon={<i className="fa-solid fa-user-group" />}
      />

      {Array.from(Array(playerCount).keys()).map((_, index) => (
        <Select
          key={index}
          mt="xs"
          icon={<i className="fa-solid fa-robot" />}
          label={`Player ${index + 1} API`}
          value={playerAPIs[index]}
          onChange={(api) => {
            if (api) {
              playerAPIs[index] = api
              setPlayerAPIs([...playerAPIs])
            }
          }}
          data={["None", ...Object.keys(apis).sort()]}
          withinPortal={false}
        />
      ))}
    </>
  )
}

export default BotSelector
