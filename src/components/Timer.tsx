import { doc } from "firebase/firestore"
import React from "react"
import Countdown, { zeroPad } from "react-countdown"
import { useFirestore } from "../configuration"
import { useCachedDocumentData } from "../hooks"

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

const Timer = () => {
  const firestore = useFirestore()

  let d
  try {
    d = doc(firestore, "/tournament/info")
  } catch (e) {
    console.log("Error", e)
    return
  }
  const [info] = useCachedDocumentData(d)

  if (!info?.next?.seconds) {
    return <></>
  }

  const date = new Date(info.next.seconds * 1000)
  const inThePast = date.getTime() - Date.now() <= 0

  return (
    <h3 style={{ textAlign: "center" }}>
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
  )
}

export default Timer
