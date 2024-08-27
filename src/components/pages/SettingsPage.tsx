import { Button, NumberInput, TextInput } from "@mantine/core"
import { doc, setDoc } from "firebase/firestore"
import React from "react"
import { useFirestore } from "../../configuration"
import { useCachedDocumentData, useLocalStorage } from "../../hooks"

const SettingsPage = () => {
  const firestore = useFirestore()
  const tournamentInfoDoc = doc(firestore, "/tournament/info")
  const [info] = useCachedDocumentData(tournamentInfoDoc)
  const [pointFormula1, setPointFormula1] = useLocalStorage<string>({
    key: "Point Formula 1",
    defaultValue: "",
  })
  const [pointFormula2, setPointFormula2] = useLocalStorage<string>({
    key: "Point Formula 2",
    defaultValue: "",
  })

  return (
    <div style={{ overflow: "auto", paddingTop: 40, paddingBottom: 40 }}>
      <h2>General</h2>
      <TextInput
        leftSection={<i className="fa-solid fa-calculator" />}
        label="Point Formula (1st Place)"
        value={pointFormula1}
        onChange={(event) => setPointFormula1(event.currentTarget.value)}
      />
      <TextInput
        leftSection={<i className="fa-solid fa-calculator" />}
        label="Point Formula (2nd Place)"
        value={pointFormula2}
        onChange={(event) => setPointFormula2(event.currentTarget.value)}
      />
      <p style={{ maxWidth: 500 }}>
        The point formula should be an expression of the form <code>n-2</code>{" "}
        or <code>2*n-1</code>. This will be the automatic point increase given
        in the Round Page where n is the number of players in a simulation. This
        can be any valid JS code which uses n, but be careful because it is
        unsafely evaluated.
      </p>
      <h2>Teams</h2>
      {info?.teams?.map((team: any, teamIndex: number) => {
        return (
          <div
            key={teamIndex}
            style={{
              marginBottom: 20,
              width: 500,
              maxWidth: "95vw",
              borderRadius: 10,
              padding: 20,
              backgroundColor: "#000",
            }}
          >
            <TextInput
              mb="xs"
              label="Name"
              leftSection={<i className="fa-solid fa-circle-user" />}
              value={team?.name}
              onChange={(event) => {
                info.teams[teamIndex].name = event.currentTarget.value
                setDoc(
                  tournamentInfoDoc,
                  { teams: info.teams },
                  { merge: true }
                )
              }}
            />
            <TextInput
              mb="xs"
              label="Members"
              leftSection={<i className="fa-solid fa-people-group" />}
              value={team?.members}
              onChange={(event) => {
                info.teams[teamIndex].members = event.currentTarget.value
                setDoc(
                  tournamentInfoDoc,
                  { teams: info.teams },
                  { merge: true }
                )
              }}
            />
            <NumberInput
              mb="xs"
              label="Points"
              leftSection={<i className="fa-solid fa-ranking-star" />}
              value={team?.points}
              onChange={(value) => {
                info.teams[teamIndex].points = value
                setDoc(
                  tournamentInfoDoc,
                  { teams: info.teams },
                  { merge: true }
                )
              }}
            />
            <Button
              fullWidth
              mt="xs"
              color="red"
              leftSection={<i className="fa-solid fa-trash" />}
              onClick={() => {
                info.teams.splice(teamIndex, 1)
                setDoc(
                  tournamentInfoDoc,
                  { teams: info.teams },
                  { merge: true }
                )
              }}
            >
              Delete
            </Button>
          </div>
        )
      })}
      <Button
        fullWidth
        leftSection={<i className="fa-solid fa-plus" />}
        onClick={() => {
          if (!info.teams) {
            info.teams = []
          }
          info.teams.push({ name: "", members: "", points: 0 })
          setDoc(tournamentInfoDoc, { teams: info.teams }, { merge: true })
        }}
      >
        Add Team
      </Button>
    </div>
  )
}

export default SettingsPage
