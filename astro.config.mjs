import { defineConfig } from 'astro/config';

const isStaging = process.env.DEPLOY_ENV === 'staging';

export default defineConfig({
  site: isStaging ? 'https://test.dreamy-records.net' : 'https://dreamy-records.net',
  base: '/',
  output: 'static',
});
