import { MantineProvider } from "@mantine/core"
import { DatesProvider } from "@mantine/dates"
import { useColorScheme } from "@mantine/hooks"
import { Notifications } from "@mantine/notifications"
import "dayjs/locale/en"
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import React from "react"
import { BrowserRouter as Router } from "react-router-dom"
import App from "./components/App"
import TopPane from "./components/TopPane"
import ConfigurationContext, {
  CodeBattlesConfiguration,
  DEFAULT_CONFIGURATION,
} from "./configuration"

interface Props {
  blocks?: React.ReactNode
  routes: Record<string, React.ReactNode>
  configuration: CodeBattlesConfiguration
}

const CodeBattles: React.FC<Props> = ({ configuration, routes, blocks }) => {
  const colorScheme = useColorScheme()
  const firebase = initializeApp(configuration.firebase)
  const firestore = getFirestore(firebase)
  const authentication = getAuth(firebase)

  return (
    <ConfigurationContext.Provider
      value={
        {
          ...DEFAULT_CONFIGURATION,
          ...configuration,
          firestore: firestore,
          authentication: authentication,
        } as any
      }
    >
      <MantineProvider forceColorScheme={colorScheme}>
        <DatesProvider
          settings={{
            locale: configuration.dates?.locale ?? "en",
            firstDayOfWeek: configuration.dates?.firstDayOfWeek ?? 0,
            weekendDays: configuration.dates?.weekendDays ?? [],
          }}
        >
          <Router>
            <Notifications />
            <div
              style={{
                position: "absolute",
                zIndex: -20,
                width: "100%",
                height: "100%",
                opacity: 0.15,
                backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                backgroundImage: "url(/images/background.png)",
                backgroundSize: "75px 75px",
                backgroundPosition: "25% 75%",
                backgroundRepeat: "space",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <TopPane />
              <div
                style={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "auto",
                }}
              >
                <App routes={routes} blocks={blocks}></App>
              </div>
            </div>
          </Router>
        </DatesProvider>
      </MantineProvider>
    </ConfigurationContext.Provider>
  )
}

export default CodeBattles

