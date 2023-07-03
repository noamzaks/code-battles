import { signOut } from "firebase/auth"
import React from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useNavigate } from "react-router-dom"
import { useAuthentication, useConfiguration } from "../configuration"
import Timer from "./Timer"

const TopPane = () => {
  const configuration = useConfiguration()
  const authentication = useAuthentication()
  const [user] = useAuthState(authentication)
  const navigate = useNavigate()

  return (
    <div
      style={{
        flex: "none",
        width: "100%",
        backgroundColor: configuration.primaryColor,
        height: "75px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 10,
        paddingRight: 10,
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "45%",
          alignItems: "center",
        }}
      >
        <img
          onClick={() => {
            // @ts-ignore
            if (window.audio) {
              // @ts-ignore
              window.audio.pause()
            }
            navigate("/")
          }}
          src="/images/logo-transparent.png"
          height={75}
          style={{ cursor: "pointer", marginInlineEnd: 20 }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h4 style={{ margin: 0 }}>{configuration.title}</h4>
          <a
            style={{ textDecoration: "none", color: "white" }}
            href="/api.html#Context"
          >
            API Docs
          </a>
        </div>
      </div>
      <div style={{ flexGrow: 1 }} />
      {document.body.clientWidth >= 500 && <Timer />}
      <div style={{ flexGrow: 1 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "45%",
          alignItems: "center",
          justifyContent: "end",
        }}
      >
        {user && (
          <>
            <p style={{ marginInlineEnd: 5 }}>
              Welcome, <b>{user.email?.split("@")[0]}</b>!
            </p>
            <i
              className="fa-solid fa-right-from-bracket"
              style={{ cursor: "pointer", marginInlineStart: 5 }}
              onClick={() => signOut(authentication)}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default TopPane
