import React, { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { BeatLoader } from 'react-spinners'
import Error from '../../components/common/Error'
import * as Yup from 'yup'
import useFetch from '../../hooks/useFetch'
import { login } from '../../services/authService'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Login = () => {
    const [errors, setErrors] = useState({})
    const [formdata, setformdata] = useState({
        email: "",
        password: ""
    })

    const navigate = useNavigate()
    let [searchParams] = useSearchParams()
    const longlink = searchParams.get("createNew")

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setformdata((prevState) => ({
            ...prevState,
            [name]: value,
        }))
    }

    const { data, error, loading, fn: fnlogin } = useFetch(login, formdata)

    useEffect(() => {
        if (data && !error) {
            navigate(`/dashboard?${longlink ? `createNew=${longlink}` : ""}`)
        }
    }, [data, error])

    const handleLogin = async () => {
        setErrors({})
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email("Invalid email").required("Email is required"),
                password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required")
            })
            await schema.validate(formdata, { abortEarly: false })
            await fnlogin(formdata)
        }
        catch (e) {
            const newerrors = {}
            e?.inner?.forEach(element => {
                newerrors[element.path] = element.message
            })
            setErrors(newerrors)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Login to your account if available</CardDescription>
                {error && <Error message={error.message} />}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input name="email" type="email" placeholder="Enter Email" onChange={handleInputChange} value={formdata.email}/>
                    {errors.email && <Error message={errors.email}/>}
                </div>
                <div className="space-y-1">
                    <Input name="password" type="password" placeholder="Enter Password" onChange={handleInputChange} value={formdata.password}/>
                    {errors.password && <Error message={errors.password}/>}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleLogin}>{loading ? <BeatLoader size={10} color="white"/> : "Login"}</Button>
            </CardFooter>
        </Card>
    )
}

export default Login
import React, { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { BeatLoader } from 'react-spinners'
import Error from '../../components/common/Error'
import * as Yup from 'yup'
import useFetch from '../../hooks/useFetch'
import { login } from '../../services/authService'
import { useNavigate, useSearchParams } from 'react-router-dom'
const Login = () => {
    const [errors, setErrors] = useState({})
    const [formdata, setformdata] = useState({
        email: "",
        password: ""
    })

    const navigate = useNavigate()
    let [searchParams] = useSearchParams()
    const longlink = searchParams.get("createNew")

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setformdata((prevState) => ({
            ...prevState,
            [name]: value,
        }))
    }

<<<<<<< HEAD
    const { data, error, loading, fn: fnlogin } = useFetch(login, formdata)
    const { fetchuser } = UrlState()

    useEffect(() => {
        if (data && !error) {
            // Determine role from the returned Supabase user object metadata
            const userRole = data.user?.user_metadata?.role || 'user';

            let dashboardPath = '/home'; // Default for customers
            if (userRole === 'rider') dashboardPath = '/rider/dashboard';
            if (userRole === 'restaurant_owner' || userRole === 'restaurant') dashboardPath = '/restaurant/dashboard';
            if (userRole === 'admin') dashboardPath = '/admin/analytics';

            navigate(`${dashboardPath}?${longlink ? `createNew=${longlink}` : ""}`)
            fetchuser()
=======
    const {data, error, loading, fn:fnlogin} = useFetch(login, formdata)

    useEffect(() => {
        if (data && !error) {
            navigate(`/dashboard?${longlink ? `createNew=${longlink}` : ""}`)
>>>>>>> e37108f92aaaeaedcefaabe81782e553b8022a50
        }
    }, [data, error])

    const handleLogin = async () => {
        setErrors({})
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email("Invalid email").required("Email is required"),
                password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required")
            })
            await schema.validate(formdata, { abortEarly: false })
            await fnlogin(formdata)
        }
        catch (e) {
            const newerrors = {}
            e?.inner?.forEach(element => {
                newerrors[element.path] = element.message
            })
            setErrors(newerrors)
        }
    }

<<<<<<< HEAD
    return (
        <Card>
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Login to your account if available</CardDescription>
                {error && <Error message={error.message} />}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input name="email" type="email" placeholder="Enter Email" onChange={handleInputChange} />
                    {errors.email && <Error message={errors.email} />}
                </div>
                <div className="space-y-1">
                    <Input name="password" type="password" placeholder="Enter Password" onChange={handleInputChange} />
                    {errors.password && <Error message={errors.password} />}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleLogin}>{loading ? <BeatLoader size={10} color="white" /> : "Login"}</Button>
            </CardFooter>
        </Card>
    )
=======
  return (
    <Card>
        <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Login to your account if available</CardDescription>
            {error && <Error message={error.message}/>}
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="space-y-1">
                <Input name="email" type="email" placeholder="Enter Email" onChange={handleInputChange} value={formdata.email}/>
                {errors.email && <Error message={errors.email}/>}
            </div>
             <div className="space-y-1">
                <Input name="password" type="password" placeholder="Enter Password" onChange={handleInputChange} value={formdata.password}/>
                {errors.password && <Error message={errors.password}/>}
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleLogin}>{loading ? <BeatLoader size={10} color="white"/> : "Login"}</Button>
        </CardFooter>
    </Card>
  )
>>>>>>> e37108f92aaaeaedcefaabe81782e553b8022a50
}

export default Login
