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
  // Load the packed Python file of the project, on the main thread and on a web worker.
  const mainThreadScript = document.createElement("script")
  mainThreadScript.type = "py"
  mainThreadScript.src = "/scripts/packed.py"
  mainThreadScript.setAttribute("config", "/config.json")
  document.body.appendChild(mainThreadScript)
  const workerScript = document.createElement("script")
  workerScript.type = "py"
  workerScript.src = "/scripts/packed.py"
  workerScript.setAttribute("config", "/config.json")
  workerScript.toggleAttribute("worker", true)
  workerScript.setAttribute("name", "worker")
  document.body.appendChild(workerScript)

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
    seed: string,
    places: number[],
    statistics: Record<string, number>,
    parameters: Record<string, string>,
    verbose: boolean,
  ) => {
    // @ts-ignore
    parameters = parameters.toJs()
    // @ts-ignore
    statistics = statistics.toJs()

    const results = getLocalStorage("Results")
    if (!results[playerNames.join(", ")]) {
      results[playerNames.join(", ")] = {}
    }
    if (!results[playerNames.join(", ")][JSON.stringify(parameters)]) {
      results[playerNames.join(", ")][JSON.stringify(parameters)] = []
    }
    results[playerNames.join(", ")][JSON.stringify(parameters)].push({
      seed,
      places,
      statistics,
    })
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

