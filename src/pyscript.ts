export const run = (code: string) => {
  try {
    // @ts-ignore
    window.runPython(code)
  } catch (e) {
    console.log("Setting timeout", e)
    setTimeout(() => run(code), 1000)
  }
}
