// /**
//  * This script adds necessary form type mappings to fix form type detection issues
//  * You can use this to ensure that the formTypeMap has the proper type data for forms
//  */

// const fs = require('fs');
// const path = require('path');

// // This function should be added to your extract_pokemon_data.ts file before the final output
// function addFormTypeMappings() {
//   console.log('Adding form type mappings for special cases...');

//   // Ensure Tauros forms have proper type mappings
//   if (!formTypeMap['Tauros']) {
//     formTypeMap['Tauros'] = {};
//   }

//   formTypeMap['Tauros']['Paldean'] = {
//     types: ['Fighting'],
//     updatedTypes: ['Fighting'],
//   };

//   formTypeMap['Tauros']['Paldean_water'] = {
//     types: ['Fighting', 'Water'],
//     updatedTypes: ['Fighting', 'Water'],
//   };

//   formTypeMap['Tauros']['Paldean_fire'] = {
//     types: ['Fighting', 'Fire'],
//     updatedTypes: ['Fighting', 'Fire'],
//   };

//   // You can add more Pokemon form mappings here as needed

//   console.log('Added form type mappings for:', Object.keys(formTypeMap).join(', '));
// }

// // Call this function just before writing the output files
// console.log(
//   'Add this function to your extraction script and call it before generating the Pokemon files',
// );
