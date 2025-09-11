import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes'

export default [
  route('/api/chat', 'routes/api.chat.ts'),

  layout('./layout.tsx', [
    index('routes/home.tsx'),
    route('/chat', 'routes/chat.tsx'),
  ]),
] satisfies RouteConfig
