export type NavigationTarget = {
  title: string
  icon: string
  to?: { name: string; params?: Record<string, any> }
  description?: string
  disabled?: boolean
  matchRoutes?: string[]
}

export type NavigationSection = {
  title: string
  icon: string
  items: NavigationTarget[]
}

export const navigationSections: NavigationSection[] = [
  {
    title: 'Start',
    icon: 'mdi-home-variant',
    items: [
      {
        title: 'Tävlingsdagar',
        icon: 'mdi-calendar-edit',
        to: { name: 'RacedayInput' },
        description: 'Välj och uppdatera tävlingsdagar.'
      },
      {
        title: 'Tävlingsdag',
        icon: 'mdi-flag-checkered',
        disabled: true,
        matchRoutes: ['Raceday']
      },
      {
        title: 'Startlista',
        icon: 'mdi-clipboard-text-outline',
        disabled: true,
        matchRoutes: ['RacedayRace', 'race']
      }
    ]
  },
  {
    title: 'Search Horses',
    icon: 'mdi-horse-variant',
    items: [
      {
        title: 'Search Horses',
        icon: 'mdi-magnify',
        to: { name: 'HorseSearch' },
        description: 'Bläddra bland hästar sorterat på form ELO.'
      },
      {
        title: 'Häst',
        icon: 'mdi-horse',
        disabled: true,
        matchRoutes: ['HorseDetail']
      }
    ]
  },
  {
    title: 'Search Drivers',
    icon: 'mdi-account-star',
    items: [
      {
        title: 'Search Drivers',
        icon: 'mdi-account-search',
        to: { name: 'DriverSearch' },
        description: 'Topplista för kuskar baserat på form ELO.'
      },
      {
        title: 'Kusk',
        icon: 'mdi-account-tie',
        disabled: true,
        matchRoutes: ['DriverDetail']
      }
    ]
  },
  {
    title: 'Administration',
    icon: 'mdi-shield-cog',
    items: [
      {
        title: 'Administration',
        icon: 'mdi-shield-cog-outline',
        to: { name: 'Admin' },
        description: 'Manuella uppdateringar och verktyg.'
      },
      {
        title: 'ELO-översikt',
        icon: 'mdi-finance',
        to: { name: 'DevRatings' },
        description: 'Översikt av aktuella ELO-värden.'
      }
    ]
  }
]
