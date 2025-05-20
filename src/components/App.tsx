import { Loader } from "@mantine/core"
import React from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Route, Routes } from "react-router-dom"
import { useAuthentication } from "../configuration"
import Login from "./Login"
import HomePage from "./pages/HomePage"
import NotFoundPage from "./pages/NotFoundPage"
import RoundPage from "./pages/RoundPage"
import SettingsPage from "./pages/SettingsPage"
import SimulationPage from "./pages/SimulationPage"
import ViewAPIPage from "./pages/ViewAPIPage"

interface Props {
  routes: Record<string, React.ReactNode>
  blocks?: React.ReactNode
}

const App: React.FC<Props> = ({ routes, blocks }) => {
  const authentication = useAuthentication()
  const [user, loading] = useAuthState(authentication)

  if (loading) {
    return (
      <>
        <p>Signing in...</p>
        <Loader />
      </>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage blocks={blocks} />} />
        <Route path="/view/:apiname" element={<ViewAPIPage />} />
        <Route path="/simulation/:playerapis" element={<SimulationPage />} />
        <Route path="/round" element={<RoundPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
        {Object.keys(routes)
          .sort()
          .map((r) => (
            <Route key={r} path={r} element={routes[r]} />
          ))}
      </Routes>
    </>
  )
}

export default App

