import * as analyticsService from '../services/analyticsService.js'
import * as demandService from '../services/demandService.js'

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalytics()
    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const getDemandZones = async (req, res, next) => {
  try {
    const zones = demandService.getDemandZones()
    res.json({ zones, timestamp: new Date().toISOString() })
  } catch (error) {
    next(error)
  }
}
