import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '../components/auth/LoginForm'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/' })
    }
  },
  component: Login,
})

function Login() {
  return <LoginForm />
}
