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
import { signup } from '../../services/authService'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Register = () => {
    const [errors, setErrors] = useState([])
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user"
    })

    const navigate = useNavigate()
    let [searchParams] = useSearchParams()
    const longlink = searchParams.get("createNew")

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }))
    }

    const { data, error, loading, fn: fnSignup } = useFetch(signup, formData)

    useEffect(() => {
        if (data && !error) {
            if (data.requiresEmailConfirmation) {
                // Email confirmation required — stay on the page; the UI renders a notice below
                return
            }
            // Navigate based on selected role
            const role = formData.role
            let destination = '/home'
            if (role === 'restaurant_owner' || role === 'restaurant') destination = '/restaurant/dashboard'
            else if (role === 'rider') destination = '/rider/dashboard'
            else if (role === 'admin') destination = '/admin/analytics'

            navigate(`${destination}${longlink ? `?createNew=${longlink}` : ""}`, { replace: true })
        }
    }, [data, error])

    const handleSignup = async () => {
        setErrors([])
        try {
            const schema = Yup.object().shape({
                full_name: Yup.string().trim().min(2, "Full name must be at least 2 characters").required("Full name is required"),
                username: Yup.string().trim()
                    .min(3, "Username must be at least 3 characters")
                    .max(30, "Username must be 30 characters or less")
                    .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
                    .required("Username is required"),
                email: Yup.string().email("Invalid email").required("Email is required"),
                password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
                confirmPassword: Yup.string()
                    .oneOf([Yup.ref('password')], 'Passwords must match')
                    .required("Please confirm your password"),
                role: Yup.string()
                    .oneOf(['user', 'rider', 'restaurant_owner'], "Please select a valid role")
                    .required("Please select a role")
            })
            await schema.validate(formData, { abortEarly: false })
            await fnSignup({
                email: formData.email,
                password: formData.password,
                role: formData.role,
                username: formData.username.trim(),
                full_name: formData.full_name.trim(),
            })
        }
        catch (e) {
            const newErrors = {}
            e?.inner?.forEach(element => {
                newErrors[element.path] = element.message
            })
            setErrors(newErrors)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started</CardDescription>
                {error && <Error message={error.message} />}
                {data?.requiresEmailConfirmation && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-1">
                        Account created! Check your email and confirm before logging in.
                    </p>
                )}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input
                        name="full_name"
                        type="text"
                        placeholder="Full Name"
                        onChange={handleInputChange}
                        value={formData.full_name}
                    />
                    {errors.full_name && <Error message={errors.full_name} />}
                </div>
                <div className="space-y-1">
                    <Input
                        name="username"
                        type="text"
                        placeholder="Username"
                        onChange={handleInputChange}
                        value={formData.username}
                    />
                    {errors.username && <Error message={errors.username} />}
                </div>
                <div className="space-y-1">
                    <Input
                        name="email"
                        type="email"
                        placeholder="Enter Email"
                        onChange={handleInputChange}
                        value={formData.email}
                    />
                    {errors.email && <Error message={errors.email} />}
                </div>
                <div className="space-y-1">
                    <Input
                        name="password"
                        type="password"
                        placeholder="Enter Password"
                        onChange={handleInputChange}
                        value={formData.password}
                    />
                    {errors.password && <Error message={errors.password} />}
                </div>
                <div className="space-y-1">
                    <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        onChange={handleInputChange}
                        value={formData.confirmPassword}
                    />
                    {errors.confirmPassword && <Error message={errors.confirmPassword} />}
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium">I am a...</p>
                    <div className="flex gap-2">
                        {[
                            { value: 'user', label: 'Customer' },
                            { value: 'rider', label: 'Rider' },
                            { value: 'restaurant_owner', label: 'Restaurant Owner' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, role: value }))}
                                className={`flex-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors
                                    ${formData.role === value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-input hover:bg-accent'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {errors.role && <Error message={errors.role} />}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSignup}>
                    {loading ? <BeatLoader size={10} color="white" /> : "Sign Up"}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default Register
