// CJS shim for next-intl/navigation — ESM-only, can't be loaded by Jest directly.
const NextLink = require('next/link').default
const { usePathname, useRouter, redirect } = require('next/navigation')

const createNavigation = () => ({
  Link: NextLink,
  usePathname,
  useRouter,
  redirect,
  getPathname: () => '/',
})

module.exports = { createNavigation }
