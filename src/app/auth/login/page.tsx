import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'

export const metadata = {
  title: 'Login - Zenx Blog',
  description: 'Sign in to your Zenx Blog account',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" />}>
      <LoginForm />
    </Suspense>
  )
}
