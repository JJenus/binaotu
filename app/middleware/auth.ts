export default defineNuxtRouteMiddleware((to) => {
  if (!useAuth().isSignedIn.value) return navigateTo({ path: '/login', query: { next: to.fullPath } })
})
