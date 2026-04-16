import type { Machine, Slot, Product, StockLog } from '~/types'

export const useVendTrack = () => {
  const supabase = useSupabaseClient()

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

  return {
    fetchMachines,
    fetchMachine,
    fetchSlotsForMachine,
    updateSlotQuantity,
    refillAllSlots,
    updateCashCollected,
    fetchProducts
  }
}
