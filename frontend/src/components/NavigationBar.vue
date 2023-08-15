<template>
    <v-app-bar app fixed elevation>
        <v-btn to="/" text>
            Home
        </v-btn>
        <v-btn to="/racedays" text>
            Race Days
        </v-btn>
        <!-- Add other navigation buttons/links as needed -->
    </v-app-bar>
</template>

<script>
export default {
    name: 'NavigationBar',
}
</script>