import { Autocomplete, Loader } from "@mantine/core"
import { doc, setDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { useAuthentication, useFirestore } from "../../configuration"
import { useCachedDocumentData, useUserAPIs } from "../../hooks"
import Block from "./Block"

const PickBotBlock = () => {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)

  const firestore = useFirestore()
  const authentication = useAuthentication()
  const [apis] = useUserAPIs()
  const currentUser = authentication.currentUser?.email?.split("@")[0]
  const [pick, loadingPick] = useCachedDocumentData(
    doc(firestore, "/tournament/" + currentUser),
  )

  useEffect(() => {
    setValue(pick?.pick ?? "")
  }, [pick])

  return (
    <Block title="Tournament Bot" logo="fa-solid fa-gamepad">
      <Autocomplete
        rightSection={
          value === "" ? undefined : loading || loadingPick ? (
            <Loader size="xs" />
          ) : (
            <i className="fa-solid fa-check" style={{ color: "green" }} />
          )
        }
        leftSection={<i className="fa-solid fa-robot" />}
        label="Bot"
        data={Object.keys(apis).sort()}
        value={value}
        onChange={setValue}
        onBlur={() => {
          if (!apis[value]) {
            setValue("")
            return
          }
          if (value === pick?.pick) {
            return
          }

          setLoading(true)
          setDoc(doc(firestore, "/tournament/" + currentUser), { pick: value })
            .then(() => setLoading(false))
            .catch(() => {
              setValue("")
              setLoading(false)
            })
        }}
      />
    </Block>
  )
}

export default PickBotBlock

