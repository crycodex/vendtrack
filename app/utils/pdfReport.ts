import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Machine, Slot } from '~/types'

export const generateInventoryReport = (machinesData: { machine: Machine, slots: Slot[] }[]) => {
  const doc = new jsPDF()
  const date = new Date().toLocaleString()

  doc.setFontSize(20)
  doc.text('Reporte de Inventario - VendTrack', 14, 22)
  
  doc.setFontSize(10)
  doc.text(`Fecha y hora de emisión: ${date}`, 14, 30)

  let finalY = 35
  let totalCashGeneral = 0

  machinesData.forEach(({ machine, slots }) => {
    // Machine Header
    doc.setFontSize(14)
    doc.text(`Máquina: ${machine.name} (${machine.type})`, 14, finalY + 10)
    
    doc.setFontSize(10)
    doc.text(`Efectivo Recaudado: $${machine.cash_collected}`, 14, finalY + 16)
    totalCashGeneral += Number(machine.cash_collected) || 0

    // Alerts
    const emptySlots = slots.filter(s => s.quantity === 0)
    const lowSlots = slots.filter(s => s.quantity > 0 && s.quantity <= (s.max_quantity * 0.2))

    if (emptySlots.length > 0 || lowSlots.length > 0) {
      doc.setTextColor(220, 38, 38) // Red
      const alerts: string[] = []
      if (emptySlots.length > 0) alerts.push(`${emptySlots.length} ranuras vacías`)
      if (lowSlots.length > 0) alerts.push(`${lowSlots.length} ranuras por agotarse`)
      doc.text(`Alertas: ${alerts.join(' | ')}`, 14, finalY + 22)
      doc.setTextColor(0, 0, 0)
      finalY += 26
    } else {
      finalY += 22
    }

    // AutoTable rows
    const tableData = slots.map(slot => {
      const productName = slot.product?.name || 'Vacío / Sin Asignar'
      const pos = machine.type === 'vending' ? `F${slot.row}-C${slot.col}` : '-'
      const isLow = slot.quantity <= (slot.max_quantity * 0.2)
      const isEmpty = slot.quantity === 0
      
      let status = 'OK'
      if (isEmpty) status = 'Vacío'
      else if (isLow) status = 'Bajo Stock'

      return [pos, productName, `${slot.quantity} / ${slot.max_quantity}`, status]
    })

    autoTable(doc, {
      startY: finalY,
      head: [['Posición', 'Producto', 'Cantidad', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] },
      didDrawPage: (data) => {
        finalY = data.cursor?.y || finalY
      }
    })

    finalY += 10
  })

  // Final Total Summary
  doc.setFontSize(14)
  doc.text(`Total Efectivo Consolidado: $${totalCashGeneral.toFixed(2)}`, 14, finalY + 10)

  doc.save(`VendTrack_Reporte_${new Date().getTime()}.pdf`)
}
