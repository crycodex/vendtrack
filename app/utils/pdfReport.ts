import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Machine, Slot } from '~/types'

function fileSlug (name: string, max = 36) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max) || 'archivo'
}

function safeFileDate () {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
}

function emitStamp () {
  return new Date().toLocaleString('es', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

/** Inventario por máquina y ranura (una o varias máquinas). */
export const generateInventoryReport = (
  machinesData: { machine: Machine, slots: Slot[] }[],
  options?: { filePrefix?: string }
) => {
  const doc = new jsPDF() as DocWithTable
  const date = emitStamp()
  const prefix = options?.filePrefix ?? 'VendTrack_Inventario'

  doc.setFontSize(18)
  doc.setTextColor(30, 30, 30)
  doc.text('Reporte de inventario — VendTrack', 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(`Emitido: ${date}`, 14, 26)

  let cursorY = 32
  let totalCashGeneral = 0

  machinesData.forEach(({ machine, slots }) => {
    if (cursorY > 230) {
      doc.addPage()
      cursorY = 20
    }

    doc.setFontSize(12)
    doc.setTextColor(20, 20, 20)
    doc.text(machine.name, 14, cursorY + 6)
    doc.setFontSize(9)
    doc.setTextColor(70, 70, 70)
    doc.text(`Tipo: ${machine.type} · Efectivo registrado: $${Number(machine.cash_collected).toFixed(2)}`, 14, cursorY + 12)
    totalCashGeneral += Number(machine.cash_collected) || 0

    const emptySlots = slots.filter(s => s.quantity === 0)
    const lowSlots = slots.filter(s => s.quantity > 0 && s.quantity <= (s.max_quantity * 0.2))

    let tableStartY = cursorY + 22
    if (emptySlots.length > 0 || lowSlots.length > 0) {
      const alertY = cursorY + 18
      doc.setTextColor(185, 50, 50)
      const alerts: string[] = []
      if (emptySlots.length > 0) alerts.push(`${emptySlots.length} ranura(s) vacía(s)`)
      if (lowSlots.length > 0) alerts.push(`${lowSlots.length} ranura(s) con stock bajo`)
      doc.text(`Alertas: ${alerts.join(' · ')}`, 14, alertY)
      doc.setTextColor(0, 0, 0)
      tableStartY = alertY + 8
    }

    const tableData = slots.map(slot => {
      const productName = slot.product?.name || 'Vacío / sin asignar'
      const pos = machine.type === 'vending' ? `F${slot.row}-C${slot.col}` : '—'
      const isLow = slot.quantity > 0 && slot.quantity <= (slot.max_quantity * 0.2)
      const isEmpty = slot.quantity === 0

      let status = 'OK'
      if (isEmpty) status = 'Vacío'
      else if (isLow) status = 'Bajo'

      return [pos, productName, `${slot.quantity} / ${slot.max_quantity}`, status]
    })

    autoTable(doc, {
      startY: tableStartY,
      head: [['Posición', 'Producto', 'Cantidad / máx.', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [55, 65, 81], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    })

    cursorY = doc.lastAutoTable?.finalY ?? cursorY
    cursorY += 14
  })

  if (cursorY > 250) {
    doc.addPage()
    cursorY = 20
  }
  doc.setFontSize(11)
  doc.setTextColor(20, 20, 20)
  doc.text(`Total efectivo consolidado (registrado en máquinas): $${totalCashGeneral.toFixed(2)}`, 14, cursorY + 10)

  doc.save(`${prefix}_${safeFileDate()}.pdf`)
}

/** Vista agregada por producto (inventario general). */
export const generateAggregatedInventoryPdf = (
  rows: { name: string, qty: number, totalCost: number, totalRevenue: number }[],
  totals: { units: number, cost: number, revenue: number }
) => {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Inventario general agregado — VendTrack', 14, 18)
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(`Emitido: ${emitStamp()}`, 14, 26)

  const body = rows.map(r => [
    r.name,
    String(r.qty),
    `$${r.totalCost.toFixed(2)}`,
    `$${r.totalRevenue.toFixed(2)}`,
    `$${(r.totalRevenue - r.totalCost).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: 34,
    head: [['Producto', 'Unidades', 'Valor costo', 'Valor venta (potencial)', 'Margen potencial']],
    body,
    foot: [[
      'Totales',
      String(totals.units),
      `$${totals.cost.toFixed(2)}`,
      `$${totals.revenue.toFixed(2)}`,
      `$${(totals.revenue - totals.cost).toFixed(2)}`
    ]],
    theme: 'striped',
    headStyles: { fillColor: [55, 65, 81], fontSize: 9 },
    footStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'bold' },
    margin: { left: 14, right: 14 }
  })

  doc.save(`VendTrack_Inventario_agregado_${safeFileDate()}.pdf`)
}

/** Historial de ventas (reducciones de stock) y totales. */
export const generateProfitsReportPdf = (
  rows: { date: string, machine: string, product: string, qty: number, lineProfit: number }[],
  totals: { costs: number, revenue: number, profit: number }
) => {
  const doc = new jsPDF({ orientation: rows.length > 22 ? 'landscape' : 'portrait' })
  doc.setFontSize(18)
  doc.text('Reporte de ganancias — VendTrack', 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(`Emitido: ${emitStamp()}`, 14, 22)
  doc.setFontSize(10)
  doc.setTextColor(20, 20, 20)
  doc.text(
    `Resumen: costo mercadería vendida $${totals.costs.toFixed(2)} · ingresos $${totals.revenue.toFixed(2)} · ganancia neta $${totals.profit.toFixed(2)}`,
    14,
    30,
    { maxWidth: 180 }
  )

  const body = rows.map(r => [
    r.date,
    r.machine,
    r.product,
    String(r.qty),
    `$${r.lineProfit.toFixed(2)}`
  ])

  autoTable(doc, {
    startY: 42,
    head: [['Fecha', 'Máquina', 'Producto', 'Uds.', 'Ganancia línea']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [55, 65, 81], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 38 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  })

  doc.save(`VendTrack_Ganancias_${safeFileDate()}.pdf`)
}

/** Una sola máquina: nombre legible en el archivo. */
export const generateMachineInventoryPdf = (machine: Machine, slots: Slot[]) => {
  const slug = fileSlug(machine.name)
  generateInventoryReport([{ machine, slots }], {
    filePrefix: `VendTrack_${slug}`
  })
}
