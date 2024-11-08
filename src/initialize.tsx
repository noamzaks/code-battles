import { notifications } from "@mantine/notifications"
import React from "react"
import {
  getLocalStorage,
  setLocalStorage,
  updatePointModifier,
} from "./utilities"

import "prismjs/prism.js"

import "prismjs/components/prism-python.js"
import "prismjs/plugins/line-numbers/prism-line-numbers.js"

const initialize = () => {
  // @ts-ignore
  window.showAlert = (
    title: string,
    alert: string,
    color: string,
    icon: string,
    limitTime: number,
    isCode: boolean,
  ) => {
    // @ts-ignore
    const difference = Date.now() - (window.lastSet ?? 0)

    if (difference >= limitTime) {
      notifications.show({
        title,
        message: alert.split("\n").map((line, index) => (
          <p key={index} style={{ margin: 0 }}>
            {isCode ? <code>{line}</code> : line}
          </p>
        )),
        color,
        icon: <i className={icon} />,
      })

      // @ts-ignore
      window.lastSet = Date.now()
    }
  }

  // @ts-ignore
  window.setResults = (
    playerNames: string[],
    places: number[],
    map: string,
    verbose: boolean,
  ) => {
    const results = getLocalStorage("Results")
    if (!results[playerNames.join(", ")]) {
      results[playerNames.join(", ")] = {}
    }
    if (!results[playerNames.join(", ")][map]) {
      results[playerNames.join(", ")][map] = []
    }
    results[playerNames.join(", ")][map].push(places)
    setLocalStorage("Results", results)
    updatePointModifier()

    // @ts-ignore
    window.showWinner(playerNames[places[0]], verbose)
  }

  // @ts-ignore
  window.downloadJson = (filename: string, contents: string) => {
    const a = document.createElement("a")
    a.style.display = "none"
    document.body.appendChild(a)
    a.href = "data:text/json;charset=utf-8," + contents
    a.download = filename
    a.click()
    document.body.removeChild(a)
  }
}

export default initialize
