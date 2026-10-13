import { useEffect } from 'react'

/** Sets the browser tab title, e.g. "My Tasks · TaskFlow". */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · TaskFlow` : 'TaskFlow'
  }, [title])
}
