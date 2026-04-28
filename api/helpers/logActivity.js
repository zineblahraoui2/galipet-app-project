const Activity = require('../models/activity')

/**
 * @param {string} ownerId
 * @param {string} type
 * @param {string} description
 * @param {string} [petName]
 * @param {string} [icon]
 * @param {object} [metadata]
 */
const logActivity = async (
  ownerId,
  type,
  description,
  petName = '',
  icon = '',
  metadata = {},
) => {
  try {
    await Activity.create({
      owner: ownerId,
      type,
      description,
      petName,
      icon,
      metadata,
    })
  } catch (err) {
    console.error('Activity log failed:', err.message)
  }
}

module.exports = logActivity
