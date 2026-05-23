'use client'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { user, profile, setUser, setProfile, clearAuth } = useAuthStore()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      } else {
        clearAuth()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const signInWithEmail = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
  }

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
  }

  const updatePassword = async (password: string) => {
    return supabase.auth.updateUser({ password })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.push('/')
  }

  return { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, updatePassword, signOut }
}
