import {
  ActionIcon,
  Checkbox,
  Table,
  TableData,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core"
import { useColorScheme } from "@mantine/hooks"
import React, { useState } from "react"
import "./DataTable.css"

export interface DataTableData {
  head: string[]
  body: string[][]
}

const DataTable = ({
  tableName,
  data,
  renderValue,
  renderHead,
  disableSort,
  hideIfEmpty,
  selectable,
  selectedRows,
  setSelectedRows,
  defaultSort,
  defaultReversed,
  stickyFirstColumn,
}: {
  tableName: string
  data: DataTableData
  renderValue?: (
    rowIndex: number,
    columnName: string,
    value: string,
  ) => React.ReactNode
  renderHead?: (columnName: string, columnIndex: number) => React.ReactNode
  disableSort?: boolean
  hideIfEmpty?: boolean
  selectable?: boolean
  selectedRows?: number[]
  setSelectedRows?: React.Dispatch<React.SetStateAction<number[]>>
  defaultSort?: number
  defaultReversed?: boolean
  stickyFirstColumn?: boolean
}) => {
  const [sortByColumn, setSortByColumn] = useState(defaultSort ?? 0)
  const [reversed, setReversed] = useState(defaultReversed ?? false)
  const [search, setSearch] = useState("")
  const theme = useMantineTheme()
  const colorScheme = useColorScheme()

  if (hideIfEmpty && data.body.length === 0) {
    return <></>
  }

  const reverseValue = reversed ? -1 : 1

  const id = (_: number, __: string, value: string) => value
  renderValue = renderValue ?? id
  const headId = (value: string) => value
  renderHead = renderHead ?? headId

  const bodyIndices = []
  for (let i = 0; i < data.body.length; i++) {
    bodyIndices.push(i)
  }

  const sortedIndices = bodyIndices
    .filter((i) =>
      data.body[i].some(
        (x, j) =>
          x?.includes(search) ||
          renderValue(i, data.head[j], x)?.toString().includes(search),
      ),
    )
    .sort((a, b) => {
      if (disableSort) {
        return 1
      }

      const aValue = data.body[a][sortByColumn] ?? ""
      const bValue = data.body[b][sortByColumn] ?? ""

      let difference = parseInt(bValue) - parseInt(aValue)
      if (isNaN(difference)) {
        return reverseValue * aValue?.localeCompare(bValue)
      }

      return reverseValue * difference
    })

  const displayData: TableData = {
    head: data.head.map(renderHead),
    body: sortedIndices.map((rowIndex) =>
      data.body[rowIndex].map((value, columnIndex) =>
        renderValue(rowIndex, data.head[columnIndex], value),
      ),
    ),
  }

  return (
    <>
      <TextInput
        mb="xs"
        w={400}
        maw="100%"
        placeholder="Search"
        leftSection={<i className="fa-solid fa-magnifying-glass" />}
        rightSection={
          search !== "" ? (
            <ActionIcon
              onClick={() => setSearch("")}
              variant="transparent"
              color="default"
              size={15}
            >
              <i className="fa-solid fa-xmark" />
            </ActionIcon>
          ) : undefined
        }
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <div style={{ maxWidth: "100%", overflow: "auto", maxHeight: 500 }}>
        <Table horizontalSpacing={7.5} verticalSpacing={7.5}>
          <Table.Thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor:
                colorScheme === "dark" ? theme.colors.dark[7] : "white",
              zIndex: 101,
            }}
          >
            <Table.Tr h={1}>
              {selectable && <Table.Th />}
              {displayData.head?.map((element, columnIndex) => (
                <Table.Th
                  key={columnIndex}
                  style={{
                    padding: 0,
                    verticalAlign: "top",
                    height: "inherit",
                  }}
                >
                  {element !== "" && (
                    <UnstyledButton
                      h="100%"
                      className="control"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 100,
                      }}
                      onClick={
                        disableSort
                          ? undefined
                          : () => {
                              if (sortByColumn === columnIndex) {
                                setReversed((r) => !r)
                              } else {
                                setSortByColumn(columnIndex)
                              }
                            }
                      }
                    >
                      {disableSort || (
                        <i
                          style={{ fontSize: 14, marginBottom: 5 }}
                          className={
                            sortByColumn === columnIndex
                              ? reversed
                                ? "fa-solid fa-sort-up"
                                : "fa-solid fa-sort-down"
                              : "fa-solid fa-sort"
                          }
                        />
                      )}
                      {element}
                    </UnstyledButton>
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {displayData.body?.map((row, rowIndex) => {
              const realIndex = sortedIndices[rowIndex]

              return (
                <Table.Tr key={rowIndex}>
                  {selectable && (
                    <Table.Td>
                      <Checkbox
                        checked={selectedRows?.includes(realIndex)}
                        onChange={(e) => {
                          if (setSelectedRows) {
                            if (e.currentTarget.checked) {
                              setSelectedRows((s) => [...s, realIndex])
                            } else {
                              setSelectedRows((s) =>
                                s.filter((x) => x !== realIndex),
                              )
                            }
                          }
                        }}
                      />
                    </Table.Td>
                  )}
                  {row.map((value, valueIndex) => (
                    <Table.Td
                      key={valueIndex}
                      style={{
                        whiteSpace: "nowrap",
                        ...(stickyFirstColumn && valueIndex === 0
                          ? {
                              position: "sticky",
                              right: 0,
                              backgroundColor:
                                colorScheme === "dark"
                                  ? theme.colors.dark[7]
                                  : "white",
                              zIndex: 100,
                            }
                          : {}),
                      }}
                    >
                      {value}
                    </Table.Td>
                  ))}
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </div>
    </>
  )
}

export default DataTable

