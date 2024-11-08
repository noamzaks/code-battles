import { Select } from "@mantine/core"
import { doc, setDoc } from "firebase/firestore"
import React from "react"
import { useAuthentication, useFirestore } from "../../configuration"
import { useCachedDocumentData, useUserAPIs } from "../../hooks"
import Block from "./Block"

const PickBotBlock = () => {
  const firestore = useFirestore()
  const authentication = useAuthentication()
  const [apis] = useUserAPIs()
  const currentUser = authentication.currentUser?.email?.split("@")[0]
  const [value] = useCachedDocumentData(
    doc(firestore, "/tournament/" + currentUser),
  )

  return (
    <Block title="Tournament Bot" logo="fa-solid fa-gamepad">
      <Select
        leftSection={<i className="fa-solid fa-robot" />}
        label="Bot"
        data={Object.keys(apis)}
        value={value?.pick}
        onChange={(s) =>
          setDoc(doc(firestore, "/tournament/" + currentUser), { pick: s })
        }
      />
    </Block>
  )
}

export default PickBotBlock
