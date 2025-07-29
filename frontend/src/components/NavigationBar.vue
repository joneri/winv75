<template>
    <v-app-bar app color="primary" dark>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>Navbar</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn to="/" text>Home</v-btn>
        <v-btn to="/admin" text>Admin</v-btn>
    </v-app-bar>
</template>

<script>

</script>
