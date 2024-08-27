import { Button, Select } from "@mantine/core"
import { TimeInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { Firestore, Timestamp, doc, getDoc, setDoc } from "firebase/firestore"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useFirestore } from "../../configuration"
import { useUserAPIs } from "../../hooks"
import Block from "./Block"

const fetchPlayer = async (name: string, firestore: Firestore) => {
  const selection = await getDoc(
    doc(firestore, "/tournament/" + name.toLowerCase())
  )
  const pick = selection.data()?.pick
  const apis = await getDoc(doc(firestore, "/bots/" + name.toLowerCase()))
  const api = apis.data()![pick]

  if (api !== undefined) {
    await setDoc(
      doc(firestore, `/bots/admin`),
      { [name]: api },
      { merge: true }
    )

    notifications.show({
      title: `Succesfully fetched ${name}`,
      message: `Their chosen API name was ${pick}`,
      icon: <i className="fa-solid fa-check" />,
      color: "green",
    })
  } else {
    notifications.show({
      title: `${name} did not pick a valid API!`,
      message: `Their chosen API name was ${pick}`,
      icon: <i className="fa-solid fa-xmark" />,
      color: "red",
    })
  }
}

const AdminBlock = () => {
  const firestore = useFirestore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [apis] = useUserAPIs()
  const [chosenBot, setChosenBot] = useState("")
  const [nextRoundTime, setNextRoundTime] = useState("")

  const fetchLatestAPIs = async () => {
    setLoading(true)

    const promises: Promise<void>[] = []
    const info = doc(firestore, "/tournament/info")
    const d = (await getDoc(info)).data() as any
    for (const team of d.teams) {
      const promise = fetchPlayer(team.name, firestore)
      promises.push(promise)
    }

    Promise.all(promises)
      .then(() => setLoading(false))
      .catch((e) => {
        setLoading(false)
        console.error(e)
      })
  }

  const publish = async () => {
    await setDoc(
      doc(firestore, "/bots/public"),
      { [chosenBot]: apis[chosenBot] },
      { merge: true }
    )

    notifications.show({
      title: `Succesfully Published ${chosenBot}`,
      message: `Users will now be able to view the code and play against it`,
      icon: <i className="fa-solid fa-check" />,
      color: "green",
    })
    setChosenBot("")
  }

  const saveRoundTime = async () => {
    const [hours, minutes] = nextRoundTime.split(":")
    const now = new Date()
    now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
    await setDoc(
      doc(firestore, "/tournament/info"),
      {
        next: new Timestamp(now.getTime() / 1000, 0),
      },
      { merge: true }
    )
  }

  return (
    <Block title="Admin" logo="fa-solid fa-shield-halved">
      <Button
        mt="xs"
        fullWidth
        variant="default"
        leftSection={<i className="fa-solid fa-gear" />}
        onClick={() => navigate("/settings")}
      >
        Settings
      </Button>
      <Button.Group mt="xs">
        <Button
          style={{ width: "50%" }}
          variant="default"
          leftSection={<i className="fa-solid fa-edit" />}
          onClick={() => navigate("/round?edit=true")}
        >
          Edit Round
        </Button>
        <Button
          style={{ width: "50%" }}
          variant="default"
          leftSection={<i className="fa-solid fa-gamepad" />}
          onClick={() => navigate("/round")}
        >
          View Round
        </Button>
      </Button.Group>
      <Button
        mt="xs"
        fullWidth
        variant="default"
        leftSection={<i className="fa-solid fa-download" />}
        onClick={fetchLatestAPIs}
        loading={loading}
      >
        Fetch Latest APIs
      </Button>
      <TimeInput
        mt="xs"
        label="Next Round"
        value={nextRoundTime}
        onChange={(e) => setNextRoundTime(e.currentTarget.value)}
        leftSection={<i className="fa-solid fa-clock" />}
      />
      <Button
        mt="xs"
        fullWidth
        variant="default"
        leftSection={<i className="fa-solid fa-save" />}
        onClick={saveRoundTime}
      >
        Save
      </Button>
      <Select
        mt="xs"
        leftSection={<i className="fa-solid fa-robot" />}
        label="API"
        data={Object.keys(apis).sort()}
        value={chosenBot}
        allowDeselect
        onChange={(e) => {
          if (e) {
            setChosenBot(e)
          } else {
            setChosenBot("")
          }
        }}
      />
      <Button
        mt="xs"
        fullWidth
        variant="default"
        leftSection={<i className="fa-solid fa-globe" />}
        onClick={publish}
      >
        Publish
      </Button>
    </Block>
  )
}

export default AdminBlock
