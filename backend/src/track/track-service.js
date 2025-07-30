import Track from './track-model.js'

const getTrackByCode = async (trackCode) => {
  return await Track.findOne({ trackCode }).lean()
}

export default {
  getTrackByCode
}
