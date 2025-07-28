import mongoose from 'mongoose'

export const validateNumericParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName]
  if (!value || !/^[0-9]+$/.test(value)) {
    return res.status(400).json({ error: `${paramName} must be a number` })
  }
  next()
}

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName]
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({ error: `${paramName} is not a valid id` })
  }
  next()
}
