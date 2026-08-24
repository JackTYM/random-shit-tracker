import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset,
  images: ['app/assets/icons/rocket-master.svg'],
});
