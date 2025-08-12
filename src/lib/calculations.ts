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

// Ability synergies and special effects
const ABILITY_SYNERGIES: Record<string, { description: string; category: string }> = {
  "Drought": { description: "Powers up Fire moves and weakens Water moves", category: "Weather" },
  "Drizzle": { description: "Powers up Water moves and weakens Fire moves", category: "Weather" },
  "Sand Stream": { description: "Summons sandstorm that damages non-Ground/Rock/Steel types", category: "Weather" },
  "Snow Warning": { description: "Summons hail that damages non-Ice types", category: "Weather" },
  "Intimidate": { description: "Lowers opponent's Attack stat", category: "Stat Reduction" },
  "Download": { description: "Raises Attack or Special Attack based on opponent's defenses", category: "Stat Boost" },
  "Trace": { description: "Copies opponent's ability", category: "Utility" },
  "Wonder Guard": { description: "Only super-effective moves can hit", category: "Protection" },
  "Magic Guard": { description: "Only takes damage from direct attacks", category: "Protection" },
  "Sturdy": { description: "Cannot be knocked out in one hit from full HP", category: "Protection" },
  "Speed Boost": { description: "Speed increases each turn", category: "Stat Boost" },
  "Moody": { description: "Sharply raises one stat and lowers another each turn", category: "Stat Boost" },
  "Chlorophyll": { description: "Doubles Speed in sunshine", category: "Weather Synergy" },
  "Swift Swim": { description: "Doubles Speed in rain", category: "Weather Synergy" },
  "Sand Rush": { description: "Doubles Speed in sandstorm", category: "Weather Synergy" },
  "Slush Rush": { description: "Doubles Speed in hail", category: "Weather Synergy" },
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
  // Round to common multipliers and clamp
  if (mult === 0) return 0
  if (mult <= 0.25) return 0.25
  if (mult <= 0.5) return 0.5
  if (mult <= 1) return 1
  if (mult <= 2) return 2
  return 4
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
  const typeEffectiveness: Record<string, { superEffective: TypeName[]; notVeryEffective: TypeName[]; noEffect: TypeName[]; normal: TypeName[] }> = {}
  
  team.forEach((p) =>
    p.moves.forEach((m) => {
      const t = (m.type || "") as TypeName
      if (t && TYPE_CHART[t.toLowerCase()]) {
        moveTypes.add(t)
        
        if (!typeEffectiveness[t]) {
          typeEffectiveness[t] = { superEffective: [], notVeryEffective: [], noEffect: [], normal: [] }
        }
        
        TYPES.forEach((defender) => {
          const effectiveness = TYPE_CHART[t.toLowerCase()]?.[defender.toLowerCase()] ?? 1
          if (effectiveness > 1) {
            typeEffectiveness[t].superEffective.push(defender)
          } else if (effectiveness === 0) {
            typeEffectiveness[t].noEffect.push(defender)
          } else if (effectiveness < 1) {
            typeEffectiveness[t].notVeryEffective.push(defender)
          } else {
            typeEffectiveness[t].normal.push(defender)
          }
        })
      }
    }),
  )
  
  const covered: TypeName[] = []
  const missing: TypeName[] = []
  const coverageMap: Record<string, { bestMultiplier: number; moveType: TypeName | null }> = {}
  
  TYPES.forEach((def) => {
    const best = Array.from(moveTypes).reduce(
      (result, mt) => {
        const multiplier = TYPE_CHART[mt.toLowerCase()]?.[def.toLowerCase()] ?? 1
        return multiplier > result.multiplier ? { multiplier, moveType: mt } : result
      },
      { multiplier: 0, moveType: null as TypeName | null }
    )
    
    coverageMap[def] = { bestMultiplier: best.multiplier, moveType: best.moveType }
    
    if (best.multiplier > 1) covered.push(def)
    else missing.push(def)
  })
  
  return { 
    moveTypes: Array.from(moveTypes), 
    covered, 
    missing, 
    typeEffectiveness,
    coverageMap 
  }
}

export function analyzeAbilitySynergies(team: PokemonEntry[]) {
  const abilities = team.map(p => p.ability).filter(Boolean)
  const synergies: { ability: string; description: string; category: string }[] = []
  const categoryCounts: Record<string, number> = {}
  
  abilities.forEach(ability => {
    if (ABILITY_SYNERGIES[ability]) {
      synergies.push({
        ability,
        description: ABILITY_SYNERGIES[ability].description,
        category: ABILITY_SYNERGIES[ability].category
      })
      
      const category = ABILITY_SYNERGIES[ability].category
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
  })
  
  // Detect potential synergies
  const weatherSetters = abilities.filter(a => ['Drought', 'Drizzle', 'Sand Stream', 'Snow Warning'].includes(a))
  const weatherUsers = abilities.filter(a => ['Chlorophyll', 'Swift Swim', 'Sand Rush', 'Slush Rush', 'Solar Power', 'Rain Dish'].includes(a))
  
  const potentialSynergies: string[] = []
  if (weatherSetters.length > 0 && weatherUsers.length > 0) {
    potentialSynergies.push('Weather synergy detected between setters and users')
  }
  if (categoryCounts['Stat Boost'] >= 2) {
    potentialSynergies.push('Multiple stat-boosting abilities for setup potential')
  }
  if (categoryCounts['Protection'] >= 2) {
    potentialSynergies.push('Strong defensive ability core')
  }
  
  return {
    synergies,
    categoryCounts,
    potentialSynergies,
    weatherSetters,
    weatherUsers
  }
}

export function computeDetailedDefensiveAnalysis(team: PokemonEntry[]) {
  const typeResistances: Record<string, number> = {}
  const typeWeaknesses: Record<string, number> = {}
  const typeImmunities: Record<string, number> = {}
  const memberAnalysis: Array<{
    name: string;
    weaknesses: TypeName[];
    resistances: TypeName[];
    immunities: TypeName[];
    ability: string;
  }> = []
  
  team.forEach(pokemon => {
    if (!pokemon.name || (!pokemon.types[0] && !pokemon.types[1])) return
    
    const weaknesses: TypeName[] = []
    const resistances: TypeName[] = []
    const immunities: TypeName[] = []
    
    TYPES.forEach(attackingType => {
      const multiplier = defensiveMultiplierAgainst(pokemon, attackingType)
      
      if (multiplier === 0) {
        immunities.push(attackingType)
        typeImmunities[attackingType] = (typeImmunities[attackingType] || 0) + 1
      } else if (multiplier >= 2) {
        weaknesses.push(attackingType)
        typeWeaknesses[attackingType] = (typeWeaknesses[attackingType] || 0) + 1
      } else if (multiplier <= 0.5) {
        resistances.push(attackingType)
        typeResistances[attackingType] = (typeResistances[attackingType] || 0) + 1
      }
    })
    
    memberAnalysis.push({
      name: pokemon.name,
      weaknesses,
      resistances,
      immunities,
      ability: pokemon.ability || 'None'
    })
  })
  
  return {
    typeResistances,
    typeWeaknesses,
    typeImmunities,
    memberAnalysis
  }
}
