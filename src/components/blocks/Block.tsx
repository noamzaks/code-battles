import { Box } from "@mantine/core"
import { useColorScheme } from "@mantine/hooks"
import React from "react"

interface Props extends React.PropsWithChildren {
  title: string
  logo: string
  inline?: boolean
}

const Block: React.FC<Props> = ({ title, logo, inline, children }) => {
  const colorScheme = useColorScheme()

  return (
    <Box
      bg={colorScheme === "dark" ? "black" : "blue.1"}
      className="block"
      style={{
        borderRadius: 10,
        padding: 10,
        marginTop: 20,
        display: inline ? "inline-block" : undefined,
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: 0,
          textAlign: "center",
        }}
      >
        <i className={logo} style={{ marginRight: 10 }} />
        {title}
      </h2>
      {children}
    </Box>
  )
}

export default Block
