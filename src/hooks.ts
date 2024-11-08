import { DocumentData, DocumentReference, doc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import {
  useAuthentication,
  useConfiguration,
  useFirestore,
} from "./configuration"
import { getLocalStorage } from "./utilities"

interface Options {
  key: string
  defaultValue?: any
}

export const useLocalStorage = <T>({
  key,
  defaultValue,
}: Options): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(
    getLocalStorage(key, defaultValue ?? null),
  )

  useEffect(() => {
    if (!localStorage.getItem(key) && defaultValue) {
      localStorage.setItem(key, JSON.stringify(defaultValue))
    }

    const listener = (e: StorageEvent) => {
      if (e.key === key) {
        if (e.newValue) {
          setValue(JSON.parse(e.newValue))
        } else {
          setValue(defaultValue ?? null)
        }
      }
    }

    window.addEventListener("storage", listener)

    return () => window.removeEventListener("storage", listener)
  }, [key])

  const userSetValue = (newValue: any) => {
    setValue(newValue)
    if (typeof newValue === "function") {
      newValue = newValue(value)
    }
    if (newValue) {
      localStorage.setItem(key, JSON.stringify(newValue))
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: JSON.stringify(newValue),
        }),
      )
    }
  }

  return [value, userSetValue]
}

export const useCachedDocumentData = (
  docRef: DocumentReference<DocumentData>,
) => {
  const [data, setData] = useLocalStorage<any>({
    key: "Cached " + docRef.path,
    defaultValue: {},
  })
  const [document, loading, error, snapshot] = useDocumentData(docRef)

  useEffect(() => {
    if (document) {
      setData(document)
    }
  }, [document])

  return [data, loading, error, snapshot]
}

/**
 * User must be authenticated
 */
export const useAPIs = () => {
  const firestore = useFirestore()
  const authentication = useAuthentication()

  const [adminAPIs, loadingAdminAPIs] = useCachedDocumentData(
    doc(firestore, "/bots/public"),
  )
  const [userAPIs, loadingUserAPIs] = useCachedDocumentData(
    doc(
      firestore,
      `/bots/${authentication?.currentUser?.email?.split("@")[0]}`,
    ),
  )

  return [
    { ...adminAPIs, ...userAPIs },
    loadingAdminAPIs || loadingUserAPIs,
    userAPIs,
  ]
}

/**
 * User must be authenticated
 */
export const useUserAPIs = () => {
  const firestore = useFirestore()
  const authentication = useAuthentication()

  const [userAPIs, loadingUserAPIs] = useCachedDocumentData(
    doc(
      firestore,
      `/bots/${authentication?.currentUser?.email?.split("@")[0]}`,
    ),
  )

  return [userAPIs, loadingUserAPIs]
}

export const useAdmin = () => {
  const configuration = useConfiguration()
  const authentication = useAuthentication()

  return (
    authentication.currentUser?.email === `${configuration.admin}@gmail.com`
  )
}
