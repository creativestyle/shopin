import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'

describe('Tabs', () => {
  it('renders without crashing', () => {
    render(
      <Tabs defaultValue='tab1'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>Content 1</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('renders multiple tabs', () => {
    render(
      <Tabs>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>Content 1</TabsContent>
        <TabsContent value='tab2'>Content 2</TabsContent>
        <TabsContent value='tab3'>Content 3</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('shows initial tab content when defaultValue is set', () => {
    render(
      <Tabs defaultValue='tab2'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>Content 1</TabsContent>
        <TabsContent value='tab2'>Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
  })

  it('switches content when tab is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue='tab1'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>Content 1</TabsContent>
        <TabsContent value='tab2'>Content 2</TabsContent>
      </Tabs>
    )

    // Initially shows tab1 content
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()

    // Click tab2
    await user.click(screen.getByText('Tab 2'))

    // Should now show tab2 content
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
  })

  it('handles multiple tab switches correctly', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue='tab1'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>Content 1</TabsContent>
        <TabsContent value='tab2'>Content 2</TabsContent>
        <TabsContent value='tab3'>Content 3</TabsContent>
      </Tabs>
    )

    // Start with tab1
    expect(screen.getByText('Content 1')).toBeInTheDocument()

    // Switch to tab2
    await user.click(screen.getByText('Tab 2'))
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()

    // Switch to tab3
    await user.click(screen.getByText('Tab 3'))
    expect(screen.getByText('Content 3')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()

    // Switch back to tab1
    await user.click(screen.getByText('Tab 1'))
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
  })

  it('ensures only one tab content is visible at a time', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue='tab1'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          <TabsTrigger value='tab4'>Tab 4</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>Content 1</TabsContent>
        <TabsContent value='tab2'>Content 2</TabsContent>
        <TabsContent value='tab3'>Content 3</TabsContent>
        <TabsContent value='tab4'>Content 4</TabsContent>
      </Tabs>
    )

    // Initially only tab1 content should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 4')).not.toBeInTheDocument()

    // Switch to tab2 - only tab2 content should be visible
    await user.click(screen.getByText('Tab 2'))
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 4')).not.toBeInTheDocument()

    // Switch to tab3 - only tab3 content should be visible
    await user.click(screen.getByText('Tab 3'))
    expect(screen.getByText('Content 3')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 4')).not.toBeInTheDocument()

    // Switch to tab4 - only tab4 content should be visible
    await user.click(screen.getByText('Tab 4'))
    expect(screen.getByText('Content 4')).toBeInTheDocument()
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()

    // Switch back to tab1 - only tab1 content should be visible
    await user.click(screen.getByText('Tab 1'))
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 4')).not.toBeInTheDocument()
  })
})
