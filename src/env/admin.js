import { getDevUrl, getStableUrl, getEnv } from '@dian/app-utils'

const envs = {
  real: {
    z: '//z.dian.so',
    o: '//o.dian.so',
    auth: '//auth.dian.so',
    dcapi: '//dcapi.dian.so',
  },
  pre: {
    z: '//z.dian-pre.com',
    o: '//o.dian-pre.com',
    auth: '//auth.dian-pre.com',
    dcapi: '//dcapi.dian-pre.com',
  },
  stable: {
    z: getStableUrl('z'),
    o: getStableUrl('o'),
    auth: getStableUrl('auth'),
    dcapi: getStableUrl('dcapi'),
  },
  dev: {
    z: getDevUrl('z'),
    o: getDevUrl('o'),
    auth: 'https://auth.dian-stable.com',
    dcapi: getDevUrl('dcapi'),
  },
  local: {
    z: '/@Z',
    o: '/@O',
    auth: getStableUrl('auth'),
    dcapi: '/@DCAPI',
  },
}

export const env = envs[getEnv()]
