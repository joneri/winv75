<template>
    <v-container fluid>
      <v-card>
        <v-card-title>
          Race Startlist
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
        
        <v-data-table
          :headers="headers"
          :items="startlistEntries"
          :search="search"
          class="elevation-1"
          @click:row="viewDetails"
        >
          <template v-slot:item.name="{ item }">
            <v-btn text :to="'/racestartlist/details/' + item.id">
              {{ item.name }}
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </template>
  
  <script>
  export default {
    data() {
      return {
        search: '',
        startlistEntries: [], // Fetch or import this data from your API/store
        headers: [
          { text: 'Horse Name', value: 'name' },
          { text: 'Gender', value: 'horseGender.text' },
          { text: 'Breed', value: 'horseBreed.text' },
          // Add other headers as necessary
        ]
      };
    },
    methods: {
      viewDetails(row) {
        this.$router.push('/racestartlist/details/' + row.id);
      }
    }
  };
  </script>