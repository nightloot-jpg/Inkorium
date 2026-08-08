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

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
})

function ForgotPassword() {
  const { t } = useTranslations()
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const forgotPasswordSchema = z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
  })

  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

  const {
    control,
    handleSubmit,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setGlobalError('')

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/update-password`,
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
              title={t('auth.forgotPassword.success.title')}
              message={t('auth.forgotPassword.success.message')}
              backToLoginText={t('auth.forgotPassword.backToLogin')}
          />
      )
  }

  return (
    <AuthCard
      title={t('auth.forgotPassword.title')}
      description={t('auth.forgotPassword.description')}
      error={globalError}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          name="email"
          control={control}
          label={t('auth.forgotPassword.emailLabel')}
          type="email"
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium rounded-lg mt-2"
          isLoading={isLoading}
        >
          {t('auth.forgotPassword.submit')}
        </Button>
      </form>

      <AuthFooter
        text=""
        linkText={t('auth.forgotPassword.backToLogin')}
        linkTo="/login"
      />
    </AuthCard>
  )
}
