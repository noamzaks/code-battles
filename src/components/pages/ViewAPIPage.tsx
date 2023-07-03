import React, { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAPIs } from "../../hooks"

const ViewAPI = () => {
  const [apis] = useAPIs()
  const { apiname } = useParams()

  useEffect(() => {
    // @ts-ignore
    Prism.highlightAll()
  }, [apis, apiname])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxHeight: "80%",
        overflow: "auto",
      }}
    >
      <h1 style={{ textAlign: "center" }}>{apiname}</h1>
      <pre style={{ width: "95vw", borderRadius: 10 }}>
        <code className="language-python">
          {apiname && apis[apiname] && apis[apiname]}
        </code>
      </pre>
    </div>
  )
}

export default ViewAPI
