import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Button } from "../../components/ui/button"
import { UrlState } from '../../context/AuthContext'
import Login from './Login'
import Register from './Register'

/**
 * Combined Login / Sign Up page — mount at the /auth route.
 * Always shows the login form. Already-authenticated users are NOT
 * auto-redirected here; they get redirected after a fresh login instead.
 */
const Auth = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isSessionLoaded, logout } = UrlState()

  if (isSessionLoaded && isAuthenticated && user) {
    const role = user?.role?.trim().toLowerCase()

    const handleGoToDashboard = () => {
      if (role === 'restaurant_owner' || role === 'restaurant') navigate('/restaurant/dashboard')
      else if (role === 'rider') navigate('/rider/dashboard')
      else if (role === 'admin') navigate('/admin/analytics')
      else navigate('/home')
    }

    const handleLogout = async () => {
      await logout()
    }

    return (
      <div className="mt-36 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-extrabold">You are already logged in!</h1>
        <p className="text-gray-500 text-lg">Logged in as {user.email} (Role: {role})</p>
        <div className="flex gap-4 mt-4">
          <Button onClick={handleGoToDashboard} size="lg">Go to Dashboard</Button>
          <Button onClick={handleLogout} variant="outline" size="lg">Logout</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-36 flex flex-col items-center gap-10">
      <h1 className="text-5xl font-extrabold">
        {searchParams.get("createNew") ? "Please login first" : "Login / Sign Up"}
      </h1>
      <Tabs defaultValue="Login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Login">Login</TabsTrigger>
          <TabsTrigger value="Sign Up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="Login"><Login /></TabsContent>
        <TabsContent value="Sign Up"><Register /></TabsContent>
      </Tabs>
    </div>
  )
}

export default Auth
