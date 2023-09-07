<template>
    <v-row>
        <v-col>
            <h1>Race Number: {{ currentRace.raceNumber }} - {{ currentRace.propTexts?.[0]?.text }} {{
                currentRace.propTexts?.[1]?.text }}</h1>
        </v-col>
    </v-row>
</template>

<script>
export default {
    props: ['currentRace'],
}
</script>