/** Sign-in and sign-up form state, and where to go afterwards. */
export function useAuthForm(mode: 'login' | 'register') {
  const auth = useAuth()
  const route = useRoute()
  const form = reactive({ name: '', email: '', password: '' })
  // Only same-site paths, so a crafted link cannot bounce people elsewhere.
  const next = computed(() => { const n = route.query.next; return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/' })

  async function submit() {
    const ok = mode === 'login' ? await auth.login({ email: form.email, password: form.password }) : await auth.register({ ...form })
    if (ok) await navigateTo(next.value, { external: true })
  }
  return { form, next, pending: auth.pending, error: auth.error, issues: auth.issues, submit }
}
