// path/to/ReactScanComponent

'use client'
import { useEffect } from 'react'
// react-scan must be imported before react
import { scan } from 'react-scan/all-environments'

export function ReactScan() {
  useEffect(() => {
    scan({
      enabled: true,
    })
  }, [])

  return null
}
