export type NavigationTarget = {
  title: string
  shortTitle?: string
  icon: string
  to: { name: string; params?: Record<string, any> }
  description?: string
  matchRoutes?: string[]
}

export type NavigationSection = {
  title: string
  items: NavigationTarget[]
}

export const primaryNavigation: NavigationTarget[] = [
  {
    title: 'Tävlingsdagar',
    shortTitle: 'Tävlingsdagar',
    icon: 'mdi-calendar-blank-outline',
    to: { name: 'RacedayInput' },
    description: 'Start, överblick och hämtning av tävlingsdagar.',
    matchRoutes: ['RacedayInput', 'Raceday', 'RacedayRace', 'race']
  },
  {
    title: 'Hästar',
    shortTitle: 'Hästar',
    icon: 'mdi-horse-variant-fast',
    to: { name: 'HorseSearch' },
    description: 'Sök och jämför hästar.',
    matchRoutes: ['HorseSearch', 'HorseDetail']
  },
  {
    title: 'Kuskar',
    shortTitle: 'Kuskar',
    icon: 'mdi-account-tie-hat',
    to: { name: 'DriverSearch' },
    description: 'Sök och jämför kuskar.',
    matchRoutes: ['DriverSearch', 'DriverDetail']
  },
  {
    title: 'Förslagsanalys',
    shortTitle: 'Förslag',
    icon: 'mdi-chart-line',
    to: { name: 'SuggestionAnalytics' },
    description: 'Följ sparade spel och modellutveckling.',
    matchRoutes: ['SuggestionAnalytics', 'SuggestionDetail']
  }
]

export const mobileNavigationSections: NavigationSection[] = [
  {
    title: 'Huvudspår',
    items: primaryNavigation
  }
]
