import { Slider } from "@mantine/core"
import { doc } from "firebase/firestore"
import React from "react"
import Countdown, { zeroPad } from "react-countdown"
import { useFirestore } from "../configuration"
import { useCachedDocumentData, useLocalStorage } from "../hooks"

const renderer = ({
  hours,
  minutes,
  seconds,
}: {
  hours: number
  minutes: number
  seconds: number
}) => (
  <span style={{ marginInlineEnd: 5 }}>
    {zeroPad(hours * 60 + minutes)}:{zeroPad(seconds)}
  </span>
)

const TimerAndVolume = () => {
  const firestore = useFirestore()

  const d = doc(firestore, "/tournament/info")
  const [info] = useCachedDocumentData(d)
  const [volume, setVolume] = useLocalStorage<number>({
    key: "Volume",
    defaultValue: 0,
  })

  if (!info?.next?.seconds) {
    return <></>
  }

  const date = new Date(info.next.seconds * 1000)
  const inThePast = date.getTime() - Date.now() <= 0

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h3 style={{ textAlign: "center", margin: 0 }}>
        <i
          className="fa-solid fa-stopwatch"
          style={{ display: "inline", marginInlineEnd: 5 }}
        />
        {inThePast ? (
          <>
            Round: {zeroPad(date.getHours())}:{zeroPad(date.getMinutes(), 2)}
          </>
        ) : (
          <>
            <Countdown date={date} renderer={renderer} />
            Remaining
          </>
        )}
      </h3>
      <Slider
        mt={5}
        min={0}
        max={100}
        value={Math.ceil(volume * 100)}
        onChange={(v) => setVolume(v / 100)}
        thumbSize={25}
        thumbChildren={
          volume === 0 ? (
            <i className="fa-solid fa-volume-xmark" style={{ fontSize: 10 }} />
          ) : volume < 0.5 ? (
            <i className="fa-solid fa-volume-low" style={{ fontSize: 10 }} />
          ) : (
            <i className="fa-solid fa-volume-high" style={{ fontSize: 10 }} />
          )
        }
      />
    </div>
  )
}

export default TimerAndVolume
