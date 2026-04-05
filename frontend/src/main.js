import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as labsComponents from 'vuetify/labs/components'
import * as directives from 'vuetify/directives'

import store from './stores'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'winv75Dark',
    themes: {
      winv75Dark: {
        dark: true,
        colors: {
          background: '#08111f',
          surface: '#0f1a2e',
          primary: '#7aa8ff',
          secondary: '#f5c979',
          success: '#38d39f',
          warning: '#f5c979',
          error: '#ff7b8f',
          info: '#59d4ff'
        }
      }
    }
  },
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
})

const app = createApp(App)

if (import.meta.env.DEV) {
  const noisySlotWarning = /Slot "(default|top|bottom)" invoked outside of the render function/
  app.config.warnHandler = (msg, instance, trace) => {
    if (noisySlotWarning.test(msg)) {
      return
    }
    console.warn(msg, trace)
  }

  app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue error]', info, err)
  }
}

app.use(vuetify).use(router).use(store).mount('#app')
