import { useViewportSize } from "@mantine/hooks"
import React from "react"
import { useAdmin } from "../../hooks"
import TimerAndVolume from "../TimerAndVolume"
import AdminBlock from "../blocks/AdminBlock"
import PickBotBlock from "../blocks/PickBotBlock"
import RunSimulationBlock from "../blocks/RunSimulationBlock"
import TournamentBlock from "../blocks/TournamentBlock"
import UploadBlock from "../blocks/UploadBlock"

interface Props {
  blocks?: React.ReactNode
}

const HomePage: React.FC<Props> = ({ blocks }) => {
  const admin = useAdmin()
  const { width: clientWidth } = useViewportSize()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        padding: 20,
        paddingTop: 10,
        width: 500,
        maxWidth: "97.5%",
      }}
    >
      {clientWidth < 650 && <TimerAndVolume />}

      {admin && <AdminBlock />}
      <UploadBlock />
      <RunSimulationBlock />
      {blocks}
      {!admin && <PickBotBlock />}
      <TournamentBlock />
    </div>
  )
}

export default HomePage
