import { doc } from "firebase/firestore"
import React from "react"
import { useFirestore } from "../../configuration"
import { useCachedDocumentData } from "../../hooks"
import RoundsTable from "../RoundsTable"
import Block from "./Block"

const RoundBlock = () => {
  const firestore = useFirestore()
  const [info] = useCachedDocumentData(doc(firestore, "/tournament/info"))

  if (!info?.round) {
    return null
  }

  return (
    <Block title="Round" logo="fa-solid fa-otter">
      <RoundsTable
        rounds={JSON.parse(info.round.rounds)}
        results={JSON.parse(info.round.results)}
        roundIterations={info.round.roundIterations}
      />
    </Block>
  )
}

export default RoundBlock
