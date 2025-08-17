// Shoe formatting and tooltip helpers for Start List
// Domain: race/horse shoes

export const shoeMap = {
  0: { id: 0, text: 'Okänd', short: '—', tip: 'Okänd sko-info' },
  4: { id: 4, text: 'Skor runt om', short: 'Skor', tip: 'Skor på alla hovar' },
  3: { id: 3, text: 'Barfota fram', short: 'Bf fram', tip: 'Barfota fram' },
  2: { id: 2, text: 'Barfota bak', short: 'Bf bak', tip: 'Barfota bak' },
  1: { id: 1, text: 'Barfota runt om', short: 'Bf r.o.', tip: 'Barfota runt om' },
}

export const getShoeById = (id) => {
  const key = Number(id)
  return shoeMap[key] || { id: key, text: `Kod ${id}`, short: `Kod ${id}`, tip: `Okänd kod ${id}` }
}
export const getShoeTooltipById = (id) => getShoeById(id).tip

export const formatShoe = (codeOrObj) => {
  if (codeOrObj == null) return '—'
  const code = typeof codeOrObj === 'object' ? codeOrObj.code : codeOrObj
  return getShoeById(code).short
}
export const shoeTooltip = (codeOrObj) => {
  if (codeOrObj == null) return ''
  const code = typeof codeOrObj === 'object' ? codeOrObj.code : codeOrObj
  return getShoeById(code).text
}

export const formatStartListShoe = (horse) => {
  const prev = horse?.previousShoeOption?.code
  const curr = horse?.shoeOption?.code
  if (prev != null && curr != null && prev !== curr) {
    return `${getShoeById(prev).short} → ${getShoeById(curr).short}`
  }
  if (curr != null) return getShoeById(curr).short
  if (prev != null) return getShoeById(prev).short
  return '—'
}

export const startListShoeTooltip = (horse) => {
  const prev = horse?.previousShoeOption?.code
  const curr = horse?.shoeOption?.code
  if (prev != null && curr != null && prev !== curr) {
    return `Skobyte: ${getShoeById(prev).text} → ${getShoeById(curr).text}`
  }
  if (curr != null) return getShoeById(curr).text
  if (prev != null) return `Föregående: ${getShoeById(prev).text}`
  return ''
}
