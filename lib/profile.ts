import type { UserProfile } from "./types"

export type ImcCategory = "Bajo peso" | "Normal" | "Sobrepeso" | "Obesidad"

export function calculateImc(pesoKg: number, alturaCm: number): number | null {
  if (!Number.isFinite(pesoKg) || !Number.isFinite(alturaCm) || pesoKg <= 0 || alturaCm <= 0) {
    return null
  }

  const alturaM = alturaCm / 100
  return Math.round((pesoKg / alturaM ** 2) * 10) / 10
}

export function getProfileImc(profile: Pick<UserProfile, "peso_kg" | "altura_cm" | "imc">): number | null {
  if (typeof profile.imc === "number" && Number.isFinite(profile.imc) && profile.imc > 0) {
    return Math.round(profile.imc * 10) / 10
  }

  return calculateImc(profile.peso_kg, profile.altura_cm)
}

export function getImcCategory(imc: number | null): ImcCategory | null {
  if (imc === null) return null
  if (imc < 18.5) return "Bajo peso"
  if (imc < 25) return "Normal"
  if (imc < 30) return "Sobrepeso"
  return "Obesidad"
}