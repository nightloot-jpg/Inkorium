import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Checkbox } from '../components/ui/Checkbox'
import { useState } from 'react'
import { Hexagon } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/login')({
  component: Login,
})

const loginSchema = z.object({
  email: z.string().min(1, 'El email es obligatorio').email('Por favor, introduzca un email válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  remember: z.boolean().default(false).optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

function Login() {
  const navigate = useNavigate()
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setGlobalError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    setIsLoading(false)

    if (error) {
      setGlobalError(error.message)
      return
    }

    // Success, redirect to home
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans bg-[#F9FAFB]">

      {/* Decorative blurry background circles to mimic the reference image gradient vibe */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E8EBF2] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FCE8F3] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-[#EBE9F5] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

      <div className="w-full max-w-[440px] p-6 relative z-10">
        {/* Placeholder Logo on top */}
        <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-soft">
                <Hexagon className="w-6 h-6 text-white" />
            </div>
        </div>

        <Card className="w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 rounded-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-2 pb-6 pt-8 px-8 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-text-main">Bienvenido de nuevo</CardTitle>
            {globalError && (
              <p className="text-sm text-error mt-2">{globalError}</p>
            )}
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">
                  Email
                </label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="email"
                      placeholder=""
                      {...field}
                      error={errors.email?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">
                  Contraseña
                </label>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="password"
                      placeholder=""
                      {...field}
                      error={errors.password?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="remember"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="remember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-muted"
                  >
                    Recordarme
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-primary hover:underline hover:text-primary-hover transition-colors">
                  ¿Olvidó su contraseña?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium rounded-lg"
                isLoading={isLoading}
              >
                Iniciar sesión
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                ¿No tiene cuenta? <a href="#" className="font-semibold text-primary hover:underline hover:text-primary-hover transition-colors">Regístrese</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
