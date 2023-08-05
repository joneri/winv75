import Horse from './horse-model.js'

async function upsertHorse(horseName, horseData) {
  const horseId = horseName.replace(/\s+/g, '-').toLowerCase()
  const horse = await Horse.findOneAndUpdate(
    { horseName },
    { horseName, horseId, horseData },
    { new: true, upsert: true }
  )
  return horse
}

export default {
  upsertHorse
}