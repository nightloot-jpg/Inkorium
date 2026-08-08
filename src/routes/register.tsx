import { createFileRoute } from '@tanstack/react-router'
import { Button } from '../components/ui/Button'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '../lib/supabase'
import { useTranslations } from '../hooks/useTranslations'
import { AuthCard } from '../components/auth/AuthCard'
import { FormField } from '../components/auth/FormField'
import { AuthFooter } from '../components/auth/AuthFooter'
import { AuthSuccess } from '../components/auth/AuthSuccess'

export const Route = createFileRoute('/register')({
  component: Register,
})

function Register() {
  const { t } = useTranslations()
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const registerSchema = z.object({
    username: z.string().min(1, t('auth.validation.usernameRequired')),
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
    password: z.string().min(8, t('auth.validation.passwordMin')),
    confirmPassword: z.string().min(1, t('auth.validation.passwordRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordMismatch'),
    path: ["confirmPassword"],
  })

  type RegisterFormValues = z.infer<typeof registerSchema>

  const {
    control,
    handleSubmit,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setGlobalError('')

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    })

    setIsLoading(false)

    if (error) {
      setGlobalError(error.message)
      return
    }

    setIsSuccess(true)
  }

  if (isSuccess) {
      return (
          <AuthSuccess
              title={t('auth.register.success.title')}
              message={t('auth.register.success.message')}
              backToLoginText={t('auth.register.success.backToLogin')}
          />
      )
  }

  return (
    <AuthCard title={t('auth.register.title')} error={globalError}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          name="username"
          control={control}
          label={t('auth.register.usernameLabel')}
          disabled={isLoading}
        />

        <FormField
          name="email"
          control={control}
          label={t('auth.register.emailLabel')}
          type="email"
          disabled={isLoading}
        />

        <FormField
          name="password"
          control={control}
          label={t('auth.register.passwordLabel')}
          type="password"
          disabled={isLoading}
        />

        <FormField
          name="confirmPassword"
          control={control}
          label={t('auth.register.confirmPasswordLabel')}
          type="password"
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium rounded-lg mt-2"
          isLoading={isLoading}
        >
          {t('auth.register.submit')}
        </Button>
      </form>

      <AuthFooter
        text={t('auth.register.hasAccount')}
        linkText={t('auth.register.signInLink')}
        linkTo="/login"
      />
    </AuthCard>
  )
}
