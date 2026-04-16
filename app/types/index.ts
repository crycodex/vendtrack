export type MachineType = 'vending' | 'coffee'

export interface Machine {
  id: string
  name: string
  type: MachineType
  rows: number | null
  columns: number | null
  cash_collected: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  sku: string
  default_max: number
}

export interface Slot {
  id: string
  machine_id: string
  row: number | null
  col: number | null
  product_id: string | null
  quantity: number
  max_quantity: number
  
  // Joined product data
  product?: Product | null
}

export interface StockLog {
  id: string
  slot_id: string
  prev_qty: number
  new_qty: number
  changed_at: string
}
