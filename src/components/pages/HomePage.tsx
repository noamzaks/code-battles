import React from "react"
import { useAdmin } from "../../hooks"
import Timer from "../Timer"
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        padding: 30,
        paddingTop: 0,
        width: 500,
        maxWidth: "95%",
      }}
    >
      {document.body.clientWidth < 500 && <Timer />}

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
