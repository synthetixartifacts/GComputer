const sveltePreprocess = require('svelte-preprocess');

/** @type {import('svelte/compiler').SvelteConfig} */
const config = {
  preprocess: sveltePreprocess({
    scss: {
      includePaths: ['app/renderer/src/styles'],
    },
    postcss: true,
  }),
};

module.exports = config;


