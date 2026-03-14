/**
 * Haversine distance formula — calculates the straight-line distance
 * between two GPS coordinates on the surface of the Earth.
 *
 * Think of the Earth as a sphere. Two restaurants are dots on that sphere.
 * This formula tells us exactly how many kilometres apart those dots are.
 *
 * @param {number} lat1 - Latitude of point 1 (e.g. restaurant)
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2 (e.g. user)
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometres
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
