import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Logo } from '../components/ui/Logo'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio').email('Introduce un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria').min(8, 'La contraseña debe tener al menos 8 caracteres'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
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
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Login data:', data)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[400px]">
        <Card className="px-8 py-10">
          <div className="flex flex-col items-center mb-8">
            <Logo className="mb-6" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-slate-500 text-center">
              Inicia sesión en tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none text-slate-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                autoComplete="email"
                disabled={isLoading}
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none text-slate-700"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Checkbox
                id="remember"
                label="Recordarme"
                disabled={isLoading}
                {...register('remember')}
              />
              <Link
                to="/"
                className="text-sm font-medium text-[#233B5D] hover:text-[#1a2c45] transition-colors focus-visible:outline-none focus-visible:underline"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>

            <Button type="submit" className="mt-2" isLoading={isLoading}>
              Iniciar sesión
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link
            to="/"
            className="font-medium text-[#233B5D] hover:text-[#1a2c45] transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
