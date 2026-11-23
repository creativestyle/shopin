import { DraftModeSessionBanner } from '@/components/layout/draft-mode-banner'
import MainNotFound from './(main)/not-found'

// Preview 404s land here, outside the preview layout's draft chrome; the banner needs a live session
export default function NotFound() {
  return (
    <>
      <DraftModeSessionBanner />
      <MainNotFound />
    </>
  )
}
