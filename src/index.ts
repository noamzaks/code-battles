import "@fortawesome/fontawesome-free/css/all.css"
import "@mantine/charts/styles.css"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import "@mantine/dropzone/styles.css"
import "@mantine/notifications/styles.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.css"
import "prismjs/themes/prism.css"
import "./index.css"
import "./prism-vsc-dark-plus.css"

declare global {
  interface Window {
    mainAudio?: HTMLAudioElement
  }
}

export * from "./components"
export { default as initialize } from "./initialize"

