import { getHeaderLayout } from '@/features/content/get-layout'
import { TopBar } from './top-bar'

export async function SiteTopBar({
  isDraft = false,
}: { isDraft?: boolean } = {}) {
  const headerLayout = await getHeaderLayout(isDraft)
  return <TopBar messages={headerLayout?.topBarMessages ?? []} />
}
