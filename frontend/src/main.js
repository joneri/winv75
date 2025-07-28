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
  theme: { defaultTheme: 'dark' },
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
})

createApp(App).use(vuetify).use(router).use(store).mount('#app')
