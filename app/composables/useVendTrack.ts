import type { Machine, Slot, Product, StockLog } from '~/types'

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
        product:product_id (*)
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

    // Insert stock log
    const { error: logError } = await supabase
      .from('stock_logs')
      .insert({
        slot_id: slotId,
        prev_qty: prevQty,
        new_qty: newQty
      })

    if (logError) throw logError
  }

  const refillAllSlots = async (machineId: string, slots: Slot[]) => {
    for (const slot of slots) {
      if (slot.quantity < slot.max_quantity) {
        await updateSlotQuantity(slot.id, slot.max_quantity, slot.quantity)
      }
    }
  }

  const updateCashCollected = async (machineId: string, amount: number) => {
    const { error } = await supabase
      .from('machines')
      .update({ cash_collected: amount })
      .eq('id', machineId)
      
    if (error) throw error
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      
    if (error) throw error
    return data as Product[]
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
      .select()
      .single()
    if (error) throw error
    return data as Product
  }

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
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
          product:product_id (*)
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
        product:product_id (*)
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
    fetchProducts,
    updateMachineName,
    updateSlotProduct,
    createProduct,
    updateProduct,
    fetchStockLogs,
    updateMachineDimensions,
    updateSlotMaxQuantity,
    addCoffeeSlot,
    deleteSlot
  }
}
