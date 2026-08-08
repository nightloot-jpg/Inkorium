import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '../lib/supabase'
import { useTranslations } from '../hooks/useTranslations'
import { AuthCard } from '../components/auth/AuthCard'
import { FormField } from '../components/auth/FormField'
import { AuthFooter } from '../components/auth/AuthFooter'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const { t } = useTranslations()
  const navigate = useNavigate()
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const loginSchema = z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
    remember: z.boolean().default(false).optional(),
  })

  type LoginFormValues = z.infer<typeof loginSchema>

  const {
    control,
    handleSubmit,
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
    <AuthCard title={t('auth.login.title')} error={globalError}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          name="email"
          control={control}
          label={t('auth.login.emailLabel')}
          type="email"
          disabled={isLoading}
        />

        <FormField
          name="password"
          control={control}
          label={t('auth.login.passwordLabel')}
          type="password"
          disabled={isLoading}
        />

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
              {t('auth.login.rememberMe')}
            </label>
          </div>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline hover:text-primary-hover transition-colors">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium rounded-lg"
          isLoading={isLoading}
        >
          {t('auth.login.submit')}
        </Button>
      </form>

      <AuthFooter
        text={t('auth.login.noAccount')}
        linkText={t('auth.login.signUpLink')}
        linkTo="/register"
      />
    </AuthCard>
  )
}
