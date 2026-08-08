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
import { AuthSuccess } from '../components/auth/AuthSuccess'

export const Route = createFileRoute('/update-password')({
  component: UpdatePassword,
})

function UpdatePassword() {
  const { t } = useTranslations()
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const updatePasswordSchema = z.object({
    password: z.string().min(8, t('auth.validation.passwordMin')),
    confirmPassword: z.string().min(1, t('auth.validation.passwordRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordMismatch'),
    path: ["confirmPassword"],
  })

  type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

  const {
    control,
    handleSubmit,
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    setIsLoading(true)
    setGlobalError('')

    const { error } = await supabase.auth.updateUser({
      password: data.password
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
              title={t('auth.updatePassword.success.title')}
              message={t('auth.updatePassword.success.message')}
              backToLoginText={t('auth.updatePassword.success.backToLogin')}
          />
      )
  }

  return (
    <AuthCard
      title={t('auth.updatePassword.title')}
      description={t('auth.updatePassword.description')}
      error={globalError}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <FormField
          name="password"
          control={control}
          label={t('auth.updatePassword.newPasswordLabel')}
          type="password"
          disabled={isLoading}
        />

        <FormField
          name="confirmPassword"
          control={control}
          label={t('auth.updatePassword.confirmPasswordLabel')}
          type="password"
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium rounded-lg mt-2"
          isLoading={isLoading}
        >
          {t('auth.updatePassword.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
