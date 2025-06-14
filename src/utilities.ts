export interface RoundInfo {
  players: string[]
  parameters: Record<string, string>
}

export const getLocalStorage = (key: string, defaultValue = {}) => {
  return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(defaultValue))
}

export const setLocalStorage = (key: string, value = {}) => {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(
    new StorageEvent("storage", { key, newValue: JSON.stringify(value) }),
  )
}

export const toTitleCase = (s: string) => {
  return s
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ")
}

export const shuffle = <T>(array: T[]): T[] => {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

export const getRank = (
  tournamentInfo: any,
  team: string,
  pointModifier: any,
) => {
  if (!tournamentInfo?.teams?.map) {
    return -1
  }

  const sorted: any[] = tournamentInfo.teams.sort(
    (a: any, b: any) =>
      b.points +
      (pointModifier![b.name] ?? 0) -
      a.points -
      (pointModifier![a.name] ?? 0),
  )

  return sorted.findIndex((t) => t.name === team)
}

export const updatePointModifier = () => {
  const rounds: RoundInfo[] = getLocalStorage("Rounds", [])
  const results = getLocalStorage("Results", {})

  const pointModifier: Record<string, number> = {}
  for (const round of rounds) {
    if (
      results[round.players.join(", ")] &&
      results[round.players.join(", ")][JSON.stringify(round.parameters)]
    ) {
      for (const result of results[round.players.join(", ")][
        JSON.stringify(round.parameters)
      ]) {
        const first = round.players[result.places[0]]
        const second = round.players[result.places[1]]
        if (!pointModifier[first]) {
          pointModifier[first] = 0
        }
        if (!pointModifier[second]) {
          pointModifier[second] = 0
        }

        const pointFormula1 = getLocalStorage("Point Formula 1", "1")
        const pointFormula2 = getLocalStorage("Point Formula 2", "0")
        const n = round.players.length
        // @ts-ignore
        window.n = n // this is because the name 'n' is going to be lost after building
        pointModifier[first] += eval(pointFormula1)
        pointModifier[second] += eval(pointFormula2)
      }
    }
  }
  setLocalStorage("Point Modifier", pointModifier)
}

const DIGITS = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"]

export const toPlacing = (n: number) => {
  if (10 < n && n < 20) {
    return n.toString() + "th"
  }
  return n.toString() + DIGITS[n % 10]
}

export const zeroPad = (s: string, l: number) => {
  for (let i = s.length; i < l; i++) {
    s = "0" + s
  }

  return s
}

export const runNoUI = (
  parameters: Record<string, string>,
  apis: Record<string, any>,
  playerBots: string[],
  seed: string,
  verbose: boolean,
) => {
  const players = playerBots.map((api) => (api === "None" ? "" : apis[api]))
  tryUntilSuccess(() =>
    // @ts-ignore
    window._startSimulation(
      parameters,
      players,
      playerBots,
      true,
      false,
      verbose,
      seed,
    ),
  )
}

export const tryUntilSuccess = (f: () => void, timeout = 500) => {
  try {
    f()
  } catch (error: any) {
    console.log("Failed, waiting for timeout...", error?.message)
    setTimeout(() => tryUntilSuccess(f, timeout), timeout)
  }
}

export const downloadFile = (
  filename: string,
  mimeType: string,
  contents: string,
) => {
  const a = document.createElement("a")
  a.style.display = "none"
  document.body.appendChild(a)
  a.href = `data:${mimeType};charset=utf-8,${encodeURIComponent(contents)}`
  a.download = filename
  a.click()
  document.body.removeChild(a)
}

