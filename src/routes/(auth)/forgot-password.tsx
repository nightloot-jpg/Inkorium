import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useTranslations } from '@/hooks/useTranslations'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPassword,
})

function ForgotPassword() {
  const { t } = useTranslations()

  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const forgotPasswordSchema = z.object({
    email: z
      .string()
      .min(1, t('auth.validation.emailRequired' as any))
      .email(t('auth.validation.emailInvalid' as any)),
  })

  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setGlobalError('')

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.inkorium.es'

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${origin}/update-password`,
    })

    setIsLoading(false)

    if (error) {
      if (
        error.message.includes('send') ||
        error.message.includes('email')
      ) {
        setGlobalError(t('auth.forgotPassword.errors.sendFailed' as any))
      } else if (error.message.includes('rate limit')) {
        setGlobalError(t('auth.forgotPassword.errors.unexpected' as any))
      } else {
        setGlobalError(t('auth.forgotPassword.errors.unexpected' as any))
      }

      return
    }

    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <Card className="p-8 text-center">
         <h2 className="text-xl font-bold text-green-600 mb-4">{t('auth.forgotPassword.success.title' as any)}</h2>
         <p className="text-slate-600 mb-6">{t('auth.forgotPassword.success.message' as any)}</p>
         <Link to="/login" className="text-[#233B5D] hover:underline font-medium">
            {t('auth.forgotPassword.backToLogin' as any)}
         </Link>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.forgotPassword.title' as any)}</h1>
      {globalError && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{globalError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.forgotPassword.emailLabel' as any)}</label>
          <Input type="email" {...register('email')} disabled={isLoading} />
          {errors.email?.message && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? '...' : t('auth.forgotPassword.submit' as any)}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-[#233B5D] font-medium hover:underline">{t('auth.forgotPassword.backToLogin' as any)}</Link>
      </div>
    </Card>
  )
}
