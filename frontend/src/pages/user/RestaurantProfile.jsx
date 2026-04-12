import { useParams, Link } from 'react-router-dom'

const RestaurantProfile = () => {
  const { id } = useParams()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-bold text-gray-900">Restaurant Profile</h1>
      <p className="mt-2 text-sm text-gray-600">
        Detailed profile view for restaurant {id || 'unknown'} is planned for the next sprint.
      </p>
      <Link to="/search" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">
        Back to search
      </Link>
    </div>
  )
}

export default RestaurantProfile
