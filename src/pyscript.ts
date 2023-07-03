export const run = (code: string) => {
  try {
    console.log(`Running pyscript.runtime.interface.runPython(${code})`)
    // @ts-ignore
    pyscript.runtime.interface.runPython(code)
  } catch (e) {
    console.log("Setting timeout", e)
    setTimeout(() => run(code), 1000)
  }
}
