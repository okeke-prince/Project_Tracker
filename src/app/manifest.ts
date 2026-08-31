import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Architect Knowledge Tracker',
    short_name: 'ArchitectKT',
    description: 'Track your software architecture learning journey.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
