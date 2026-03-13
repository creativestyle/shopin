export const storeConfigKeys = {
  all: ['store-config'] as const,
  config: () => [...storeConfigKeys.all, 'config'] as const,
}
