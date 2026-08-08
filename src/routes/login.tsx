import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Checkbox } from '../components/ui/Checkbox'
import { useState } from 'react'
import { Hexagon } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    let hasError = false
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required.'
      hasError = true
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.'
      hasError = true
    }

    if (!password) {
      newErrors.password = 'Password is required.'
      hasError = true
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Login simulation complete
    }, 1500)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-pink-50 to-white relative overflow-hidden font-sans">

      {/* Decorative blurry background circles to mimic the reference image gradient vibe */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md p-6 relative z-10">
        <Card className="w-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-0 rounded-2xl bg-white">
          <CardHeader className="space-y-4 pb-6 pt-10 px-8 text-center">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
              {/* Placeholder logo matching reference request */}
              <Hexagon className="w-8 h-8 text-primary fill-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-text-main mb-1.5">Welcome back</CardTitle>
              <CardDescription className="text-sm text-text-muted">
                Please enter your details to sign in.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-muted"
                  >
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-primary hover:underline hover:text-primary-hover transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium rounded-lg"
                isLoading={loading}
              >
                Sign in
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-8 border-t border-border/40 pt-6">
            <p className="text-sm text-text-muted">
              Don't have an account? <a href="#" className="font-semibold text-primary hover:underline hover:text-primary-hover transition-colors">Sign up</a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
