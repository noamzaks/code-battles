import { Button } from "@mantine/core"
import React, { useEffect, useState } from "react"

const AutoScrollButton = () => {
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    // @ts-ignore
    window.autoScroll = autoScroll
  }, [autoScroll])

  return (
    <Button
      color={autoScroll ? "green" : "yellow"}
      fullWidth
      mb="xs"
      leftSection={<i className="fa-solid fa-angles-down" />}
      onClick={() => setAutoScroll((s) => !s)}
    >
      Auto Scroll {autoScroll ? "Enabled" : "Disabled"}
    </Button>
  )
}

export default AutoScrollButton
