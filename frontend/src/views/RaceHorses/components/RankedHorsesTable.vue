<template>
    <v-data-table :headers="rankedHeaders" :items="rankedHorses" :items-per-page="16" class="elevation-1">
        <!-- Your v-slot templates here -->
    </v-data-table>
</template>

<script>
export default {
    props: ['rankedHorses'],
    // rankedHeaders and other script data
}
</script>