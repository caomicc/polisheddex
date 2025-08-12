import { TYPES, type TypeName } from "./types-data"
import type { PokemonEntry } from "@/components/pokemon-slot"

// We'll load the real type chart data
let TYPE_CHART: Record<string, Record<string, number>> = {}

// Function to load the real type chart
export async function loadTypeChart() {
  try {
    const response = await fetch('/output/type_chart.json')
    TYPE_CHART = await response.json()
  } catch (error) {
    console.error('Failed to load type chart:', error)
    // Initialize with default neutral effectiveness
    TYPE_CHART = {}
    TYPES.forEach(attackingType => {
      TYPE_CHART[attackingType.toLowerCase()] = {}
      TYPES.forEach(defendingType => {
        TYPE_CHART[attackingType.toLowerCase()][defendingType.toLowerCase()] = 1
      })
    })
  }
}

// Subset of abilities affecting defensive multipliers as immunities in a simplified way
const ABILITY_IMMUNITIES: Record<string, TypeName> = {
  Levitate: "Ground",
  "Flash Fire": "Fire",
  "Water Absorb": "Water",
  "Volt Absorb": "Electric",
  "Storm Drain": "Water",
  "Lightning Rod": "Electric",
  "Sap Sipper": "Grass",
  // Simplified special-case:
  "Dry Skin": "Water",
}

// Simplified resist abilities (optional): e.g., Thick Fat reduces Fire/Ice by half again. We treat as 0.5 multiplier on top.
const ABILITY_RESISTS: Record<string, TypeName[]> = {
  "Thick Fat": ["Fire", "Ice"],
}

function defensiveMultiplierAgainst(p: PokemonEntry, attackingType: TypeName): number {
  const [t1, t2] = p.types
  let mult = 1
  const attackingTypeLower = attackingType.toLowerCase()
  if (t1) mult *= (TYPE_CHART[attackingTypeLower]?.[t1.toLowerCase()] ?? 1)
  if (t2) mult *= (TYPE_CHART[attackingTypeLower]?.[t2.toLowerCase()] ?? 1)
  const abil = String(p.ability || "").trim()
  if (abil in ABILITY_IMMUNITIES) {
    const immuneType = ABILITY_IMMUNITIES[abil]
    if (immuneType === attackingType) {
      return 0
    }
  }
  if (abil in ABILITY_RESISTS) {
    const res = ABILITY_RESISTS[abil]
    if (res.includes(attackingType)) {
      mult *= 0.5
    }
  }
  // Clamp to standard set including 0.25, 0.5, 1, 2, 4, or 0
  return mult
}

export function computeDefensiveSummary(team: PokemonEntry[]) {
  const out: Record<string, { weak: number; resist: number; immune: number }> = {}
  TYPES.forEach((atk) => {
    let weak = 0
    let resist = 0
    let immune = 0
    team.forEach((p) => {
      if (!p.types[0] && !p.types[1]) return
      const mult = defensiveMultiplierAgainst(p, atk)
      if (mult === 0) immune++
      else if (mult >= 2) weak++
      else if (mult > 0 && mult <= 0.5) resist++
    })
    out[atk] = { weak, resist, immune }
  })
  return out
}

export function computeOffensiveCoverage(team: PokemonEntry[]) {
  const moveTypes = new Set<TypeName>()
  team.forEach((p) =>
    p.moves.forEach((m) => {
      const t = (m.type || "") as TypeName
      if (t && TYPE_CHART[t.toLowerCase()]) moveTypes.add(t)
    }),
  )
  const covered: TypeName[] = []
  const missing: TypeName[] = []
  TYPES.forEach((def) => {
    const best = Array.from(moveTypes).reduce((mx, mt) => Math.max(mx, TYPE_CHART[mt.toLowerCase()]?.[def.toLowerCase()] ?? 1), 0)
    if (best > 1) covered.push(def)
    else missing.push(def)
  })
  return { moveTypes: Array.from(moveTypes), covered, missing }
}
