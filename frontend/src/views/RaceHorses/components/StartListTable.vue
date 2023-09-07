<template>
    <v-data-table :headers="headers" :items="horses" :items-per-page="16" class="elevation-1">
        <!-- Your v-slot templates here -->
    </v-data-table>
</template>

<script>
export default {
    props: {
        horses: Array,
        headers: Array
    },
}
</script>