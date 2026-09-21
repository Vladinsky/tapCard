import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'
import type { BusinessRow } from '../lib/businessAdapter'

export function useBusiness(id?: string) {
  const [result, setResult] = useState<{ id?: string; row: BusinessRow | null; error: string }>({ row: null, error: '' })
  useEffect(() => {
    if (!id) return
    let active = true
    const controller = new AbortController()
    void db().from('businesses').select('*,business_actions(*)').eq('id', id).abortSignal(controller.signal).single()
      .then(({ data, error }) => { if (active) setResult({ id, row: error ? null : data, error: error?.message || '' }) })
    return () => { active = false; controller.abort() }
  }, [id])
  return result.id === id ? result : { row: null, error: '' }
}
