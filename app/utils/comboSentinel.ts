/**
 * Reka UI (USelectMenu) no permite ComboboxItem con value === ''.
 * Usamos un centinela y lo mapeamos a null al persistir.
 */
export const COMBO_EMPTY_VALUE = '__vendtrack_none__'

export function comboToNull (v: string): string | null {
  return v === COMBO_EMPTY_VALUE ? null : v
}

export function nullToCombo (v: string | null | undefined): string {
  return v ?? COMBO_EMPTY_VALUE
}
