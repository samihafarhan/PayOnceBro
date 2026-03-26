import * as restaurantModel from '../models/restaurantModel.js'
import * as ratingModel from '../models/ratingModel.js'

export const createRestaurantRating = async (req, res, next) => {
  try {
    const { orderId, restaurantId, score, reviewText } = req.body

    if (!orderId || !restaurantId || score == null) {
      return res.status(400).json({ message: 'orderId, restaurantId and score are required' })
    }

    const parsedScore = Number(score)
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 5) {
      return res.status(400).json({ message: 'score must be an integer between 1 and 5' })
    }

    const deliveredOrder = await ratingModel.getDeliveredOrderForUser(orderId, req.user.id)
    if (!deliveredOrder) {
      return res.status(400).json({ message: 'You can only rate delivered orders that belong to you' })
    }

    const belongsToRestaurant = await ratingModel.orderIncludesRestaurant(orderId, restaurantId)
    if (!belongsToRestaurant) {
      return res.status(400).json({ message: 'This order does not include the selected restaurant' })
    }

    const existing = await ratingModel.findExistingRestaurantRating(orderId, req.user.id, restaurantId)
    if (existing) {
      return res.status(409).json({ message: 'You already rated this restaurant for this order' })
    }

    const rating = await ratingModel.createRestaurantRating({
      orderId,
      userId: req.user.id,
      restaurantId,
      score: parsedScore,
      reviewText: reviewText?.trim() || null,
    })

    const avg = await ratingModel.calculateRestaurantAverage(restaurantId)
    await ratingModel.updateRestaurantAverage(restaurantId, avg)

    res.status(201).json({ rating })
  } catch (err) {
    next(err)
  }
}

export const getRestaurantReviews = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found for this account' })
    }

    const reviews = await ratingModel.listRestaurantReviews(restaurant.id)

    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        avg_rating: restaurant.avg_rating ?? 0,
      },
      reviews,
    })
  } catch (err) {
    next(err)
  }
}

export const addRestaurantReviewResponse = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found for this account' })
    }

    const { ratingId } = req.params
    const { responseText } = req.body

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ message: 'responseText is required' })
    }

    const updated = await ratingModel.addRestaurantResponse({
      ratingId,
      restaurantId: restaurant.id,
      responseText: responseText.trim(),
    })

    if (!updated) {
      return res.status(404).json({ message: 'Review not found for your restaurant' })
    }

    res.json({ review: updated })
  } catch (err) {
    next(err)
  }
}

// Workflow-compatible aliases
export const create = createRestaurantRating

export const getByRestaurant = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params
    if (!restaurantId) {
      return res.status(400).json({ message: 'restaurant id is required' })
    }
    const ratings = await ratingModel.listRestaurantReviews(restaurantId)
    res.json(ratings)
  } catch (err) {
    next(err)
  }
}

export const addResponse = async (req, res, next) => {
  try {
    const { id: ratingId } = req.params
    const { responseText } = req.body

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ message: 'responseText is required' })
    }

    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found for this account' })
    }

    const updated = await ratingModel.addRestaurantResponse({
      ratingId,
      restaurantId: restaurant.id,
      responseText: responseText.trim(),
    })

    if (!updated) {
      return res.status(404).json({ message: 'Review not found for your restaurant' })
    }

    res.json({ rating: updated })
  } catch (err) {
    next(err)
  }
}
