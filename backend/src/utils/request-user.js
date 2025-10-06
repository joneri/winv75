const ROLE_HIERARCHY = ['viewer', 'analyst', 'admin']

export const getRequestUser = (req = {}) => {
  const headers = req.headers || {}
  const rawRole = String(headers['x-user-role'] ?? headers['x-role'] ?? 'viewer').toLowerCase()
  const role = ROLE_HIERARCHY.includes(rawRole) ? rawRole : 'viewer'
  const userId = String(headers['x-user-id'] ?? headers['x-user'] ?? 'anon')
  const teamId = headers['x-team-id'] ? String(headers['x-team-id']) : null
  const name = headers['x-user-name'] ? String(headers['x-user-name']) : null
  return {
    id: userId,
    role,
    teamId,
    name
  }
}

export const hasRole = (user, requiredRole) => {
  if (!user) return false
  const currentIdx = ROLE_HIERARCHY.indexOf(user.role || 'viewer')
  const requiredIdx = ROLE_HIERARCHY.indexOf(requiredRole)
  if (requiredIdx === -1) return false
  return currentIdx >= requiredIdx
}

export const assertRole = (user, requiredRole) => {
  if (!hasRole(user, requiredRole)) {
    const err = new Error('Insufficient role')
    err.statusCode = 403
    throw err
  }
}

