import type { Meta, StoryObj } from '@storybook/react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ComparisonTable,
  ComparisonTableHeader,
  ComparisonTableHead,
  ComparisonTableCell,
  ComparisonTableBody,
  ComparisonTableRow,
  ComparisonTableCaption,
} from '@/components/ui/comparison-table'

type BasicTableData = {
  caption: string
  head: string[]
  body: string[][]
}

type ComparisonTableData = {
  caption: string
  head: Array<{ bold: string; sub?: string }>
  body: string[][]
}

const sprintBoardData: BasicTableData = {
  caption: 'Sprint board status for the current planning cycle.',
  head: ['Task', 'Owner', 'Stage', 'Priority', 'Due date'],
  body: [
    ['Homepage hero refresh', 'Maya', 'In progress', 'High', 'Mar 29'],
    ['Checkout input validation', 'Liam', 'Review', 'Medium', 'Mar 30'],
    ['Search zero-state copy', 'Noah', 'Backlog', 'Low', 'Apr 02'],
    ['Mobile nav focus states', 'Ava', 'Done', 'High', 'Mar 26'],
  ],
}

const weeklyOperationsData: BasicTableData = {
  caption: 'Weekly operations overview by team and workstream.',
  head: ['Team', 'Workstream', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Notes'],
  body: [
    [
      'Catalog',
      'Product updates',
      '24',
      '19',
      '26',
      '22',
      '18',
      'Bulk import scheduled Thursday',
    ],
    [
      'Support',
      'Ticket handling',
      '54',
      '49',
      '61',
      '47',
      '45',
      'Peak volume expected Wednesday',
    ],
    [
      'Growth',
      'Campaign setup',
      '3',
      '4',
      '2',
      '5',
      '3',
      'Email launch Friday morning',
    ],
  ],
}

const enablementPathsData: ComparisonTableData = {
  caption:
    'Enablement path comparison for onboarding internal teams to the platform.',
  head: [
    { bold: 'Capability' },
    { bold: 'Self-serve path', sub: 'Guide + templates' },
    { bold: 'Facilitated path', sub: 'Coach-led sessions' },
  ],
  body: [
    ['Kickoff timeline', '1 week', '2 weeks'],
    ['Hands-on workshops', '{n}', '{y}'],
    ['Template library', '{y}', '{y}'],
    ['Architecture review', '{n}', '{y}'],
    ['Slack support channel', '{y}', '{y}'],
    ['Quarterly maturity check', '{n}', '{y}'],
  ],
}

function BasicTable({
  data,
  type,
}: {
  data: BasicTableData
  type?: 'scrollable'
}) {
  return (
    <Table
      type={type}
      className={type === 'scrollable' ? 'max-w-[calc(100vw-2rem)]' : undefined}
    >
      <TableCaption>{data.caption}</TableCaption>
      <TableHeader>
        <TableRow>
          {data.head.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.body.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell, index) => (
              <TableCell
                key={index}
                data-title={data.head[index]}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const meta = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['scrollable', 'flex', 'flex-simple'],
    },
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const SprintBoardTable: Story = {
  render: () => <BasicTable data={sprintBoardData} />,
}

export const WeeklyOperationsScrollable: Story = {
  name: 'Weekly operations (scrollable)',
  render: () => (
    <BasicTable
      data={weeklyOperationsData}
      type='scrollable'
    />
  ),
}

export const EnablementComparison: Story = {
  render: () => (
    <ComparisonTable>
      <ComparisonTableCaption>
        {enablementPathsData.caption}
      </ComparisonTableCaption>
      <ComparisonTableHeader>
        <ComparisonTableRow>
          {enablementPathsData.head.map((header) => (
            <ComparisonTableHead key={header.bold}>
              {header.bold}
              {header.sub && <div className='font-normal'>{header.sub}</div>}
            </ComparisonTableHead>
          ))}
        </ComparisonTableRow>
      </ComparisonTableHeader>
      <ComparisonTableBody>
        {enablementPathsData.body.map((item) => (
          <ComparisonTableRow key={item[0]}>
            {item.map((cell, index) => (
              <ComparisonTableCell key={index}>
                {index === 0 ? <strong>{cell}</strong> : cell}
              </ComparisonTableCell>
            ))}
          </ComparisonTableRow>
        ))}
      </ComparisonTableBody>
    </ComparisonTable>
  ),
}
