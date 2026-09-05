import 'server-only';

import { forgetJson } from '@/lib/cache/json-cache';

export async function invalidateBannerAdCache() {
  await forgetJson('banner-ads:active:v1');
}
