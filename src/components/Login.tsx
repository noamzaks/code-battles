import { Alert, Button, TextInput } from "@mantine/core"
import { signInWithEmailAndPassword } from "firebase/auth"
import React, { useState } from "react"
import { useAuthentication } from "../configuration"

const Login = () => {
  const authentication = useAuthentication()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const login = () => {
    setLoading(true)
    setError("")
    signInWithEmailAndPassword(
      authentication,
      username + "@gmail.com",
      password
    )
      .then(() => setLoading(false))
      .catch((e) => {
        setLoading(false)
        console.log(e)
        setError(e.message)
      })
  }

  return (
    <div style={{ width: "400px", maxWidth: "95%" }}>
      <TextInput
        label="Username"
        icon={<i className="fa-solid fa-user" />}
        value={username}
        onChange={(e) => setUsername(e.currentTarget.value)}
      />
      <TextInput
        label="Password"
        type="password"
        icon={<i className="fa-solid fa-key" />}
        value={password}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            login()
          }
        }}
        onChange={(e) => setPassword(e.currentTarget.value)}
      />
      <Button
        mt="xs"
        leftIcon={<i className="fa-solid fa-unlock" />}
        fullWidth
        loading={loading}
        onClick={login}
      >
        Login
      </Button>
      {error !== "" && (
        <Alert mt="xs" color="red" icon={<i className="fa-solid fa-xmark" />}>
          {error}
        </Alert>
      )}
    </div>
  )
}

export default Login
