<template>
    <v-tabs :value="activeTab" @input="$emit('update:activeTab', $event)">
        <v-tab>Start List</v-tab>
        <v-tab :disabled="!allHorsesUpdated">Ranked Horses</v-tab>
    </v-tabs>
</template>

<script>
export default {
    props: ['activeTab', 'allHorsesUpdated'],
    emits: ['update:activeTab']
}
</script>
