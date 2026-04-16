import type { Machine, Slot, Product, StockLog, Category } from '~/types'

const productSelect = `
  *,
  category:category_id (*)
`

export const useVendTrack = () => {
  const supabase = useSupabaseClient<any>()

  const fetchMachines = async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Machine[]
  }

  const fetchMachine = async (id: string) => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Machine
  }

  const fetchSlotsForMachine = async (machineId: string) => {
    const { data, error } = await supabase
      .from('slots')
      .select(`
        *,
        product:product_id (
          ${productSelect}
        )
      `)
      .eq('machine_id', machineId)

    if (error) throw error
    return data as Slot[]
  }

  const updateSlotQuantity = async (slotId: string, newQty: number, prevQty: number) => {
    if (newQty === prevQty) return

    const { error: updateError } = await supabase
      .from('slots')
      .update({ quantity: newQty })
      .eq('id', slotId)

    if (updateError) throw updateError

    const { error: logError } = await supabase
      .from('stock_logs')
      .insert({
        slot_id: slotId,
        prev_qty: prevQty,
        new_qty: newQty
      })

    if (logError) throw logError
  }

  /**
   * Rellena al máximo solo ranuras con producto asignado (las vacías no se tocan).
   * Devuelve cuántas ranuras se actualizaron.
   */
  const refillAllSlots = async (_machineId: string, slots: Slot[]) => {
    const toFill = slots.filter(
      s => s.product_id != null && s.quantity < s.max_quantity
    )
    await Promise.all(
      toFill.map(slot =>
        updateSlotQuantity(slot.id, slot.max_quantity, slot.quantity)
      )
    )
    return toFill.length
  }

  const updateCashCollected = async (machineId: string, amount: number) => {
    const { error } = await supabase
      .from('machines')
      .update({ cash_collected: amount })
      .eq('id', machineId)

    if (error) throw error
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data as Category[]
  }

  const createCategory = async (input: { name: string, emoji?: string | null }) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: input.name.trim(),
        emoji: input.emoji?.trim() || null
      })
      .select()
      .single()

    if (error) throw error
    return data as Category
  }

  const updateCategory = async (id: string, patch: { name?: string, emoji?: string | null }) => {
    const row: Record<string, unknown> = {}
    if (patch.name !== undefined) row.name = patch.name.trim()
    if (patch.emoji !== undefined) row.emoji = patch.emoji?.trim() || null
    const { data, error } = await supabase
      .from('categories')
      .update(row)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Category
  }

  /** Catálogo global (admin) */
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(productSelect)
      .order('name', { ascending: true })

    if (error) throw error
    return data as Product[]
  }

  /** Productos permitidos en una máquina (para ranuras) */
  const fetchMachineCatalog = async (machineId: string) => {
    const { data, error } = await supabase
      .from('machine_products')
      .select(`
        product:product_id (
          ${productSelect}
        )
      `)
      .eq('machine_id', machineId)

    if (error) throw error
    const rows = (data ?? []) as { product: Product | Product[] | null }[]
    return rows
      .map((r) => {
        const p = r.product
        return Array.isArray(p) ? p[0] ?? null : p
      })
      .filter((p): p is Product => !!p)
  }

  const addMachineProduct = async (machineId: string, productId: string) => {
    const { error } = await supabase
      .from('machine_products')
      .insert({ machine_id: machineId, product_id: productId })

    if (error) throw error
  }

  const removeMachineProduct = async (machineId: string, productId: string) => {
    const { count, error: countErr } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('machine_id', machineId)
      .eq('product_id', productId)

    if (countErr) throw countErr
    if ((count ?? 0) > 0) {
      throw new Error('Hay ranuras usando este producto. Cambia o vacía esas ranuras antes de quitarlo del catálogo de la máquina.')
    }

    const { error } = await supabase
      .from('machine_products')
      .delete()
      .eq('machine_id', machineId)
      .eq('product_id', productId)

    if (error) throw error
  }

  /** Añade al catálogo de la máquina todos los productos globales que aún no estén */
  const syncAllProductsToMachine = async (machineId: string) => {
    const [all, linked] = await Promise.all([
      fetchProducts(),
      supabase.from('machine_products').select('product_id').eq('machine_id', machineId)
    ])

    if (linked.error) throw linked.error
    const linkedIds = new Set((linked.data ?? []).map((r: { product_id: string }) => r.product_id))
    const toAdd = all.filter(p => !linkedIds.has(p.id)).map(p => ({
      machine_id: machineId,
      product_id: p.id
    }))

    if (toAdd.length === 0) return 0

    const { error } = await supabase.from('machine_products').insert(toAdd)
    if (error) throw error
    return toAdd.length
  }

  const updateMachineName = async (machineId: string, name: string) => {
    const { error } = await supabase
      .from('machines')
      .update({ name })
      .eq('id', machineId)
    if (error) throw error
  }

  const updateSlotProduct = async (slotId: string, productId: string | null) => {
    const { error } = await supabase
      .from('slots')
      .update({ product_id: productId })
      .eq('id', slotId)
    if (error) throw error
  }

  const createProduct = async (product: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select(productSelect)
      .single()
    if (error) throw error
    return data as Product
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select(productSelect)
      .single()
    if (error) throw error
    return data as Product
  }

  const fetchStockLogs = async () => {
    const { data, error } = await supabase
      .from('stock_logs')
      .select(`
        *,
        slot:slot_id (
          machine_id,
          product:product_id (${productSelect})
        )
      `)
      .order('changed_at', { ascending: false })
    if (error) throw error
    return data as (StockLog & { slot?: { machine_id: string, product?: Product } })[]
  }

  const updateMachineDimensions = async (machineId: string, rows: number, cols: number, currentSlots: Slot[]) => {
    const { error: machineErr } = await supabase
      .from('machines')
      .update({ rows, columns: cols })
      .eq('id', machineId)
    if (machineErr) throw machineErr

    const slotsToDelete = currentSlots.filter(s => (s.row && s.row > rows) || (s.col && s.col > cols))
    if (slotsToDelete.length > 0) {
      const { error: delErr } = await supabase
        .from('slots')
        .delete()
        .in('id', slotsToDelete.map(s => s.id))
      if (delErr) throw delErr
    }

    const slotsToInsert = []
    const existingCoordinates = new Set(currentSlots.map(s => `${s.row}-${s.col}`))

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const coord = `${r}-${c}`
        if (!existingCoordinates.has(coord)) {
          slotsToInsert.push({
            machine_id: machineId,
            row: r,
            col: c,
            quantity: 0,
            max_quantity: 10
          })
        }
      }
    }

    if (slotsToInsert.length > 0) {
      const { error: insErr } = await supabase
        .from('slots')
        .insert(slotsToInsert)
      if (insErr) throw insErr
    }
  }

  const updateSlotMaxQuantity = async (slotId: string, maxQty: number) => {
    const { error } = await supabase
      .from('slots')
      .update({ max_quantity: maxQty })
      .eq('id', slotId)
    if (error) throw error
  }

  const addCoffeeSlot = async (machineId: string) => {
    const { data, error } = await supabase
      .from('slots')
      .insert({
        machine_id: machineId,
        row: null,
        col: null,
        quantity: 0,
        max_quantity: 10
      })
      .select(`
        *,
        product:product_id (${productSelect})
      `)
      .single()

    if (error) throw error
    return data as Slot
  }

  const deleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', slotId)

    if (error) throw error
  }

  return {
    fetchMachines,
    fetchMachine,
    fetchSlotsForMachine,
    updateSlotQuantity,
    refillAllSlots,
    updateCashCollected,
    fetchCategories,
    createCategory,
    updateCategory,
    fetchProducts,
    fetchMachineCatalog,
    addMachineProduct,
    removeMachineProduct,
    syncAllProductsToMachine,
    updateMachineName,
    updateSlotProduct,
    createProduct,
    deleteProduct,
    updateProduct,
    fetchStockLogs,
    updateMachineDimensions,
    updateSlotMaxQuantity,
    addCoffeeSlot,
    deleteSlot
  }
}
