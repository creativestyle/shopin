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

const meta: Meta<typeof Table> = {
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
}

export default meta
type Story = StoryObj<typeof meta>

const tableDataUniversal = {
  head: [
    'Order ID',
    'Customer',
    'Status',
    'Items',
    'Total',
    'Payment Method',
    'Order Date',
    'Delivery Date',
  ],
  body: [
    [
      'ORD-2024-001',
      'John Smith',
      'Delivered',
      '3',
      '$89.99',
      'Credit Card',
      '2024-01-15',
      '2024-01-18',
    ],
    [
      'ORD-2024-002',
      'Sarah Johnson',
      'Processing',
      '1',
      '$24.50',
      'PayPal',
      '2024-01-16',
      '2024-01-20',
    ],
    [
      'ORD-2024-003',
      'Mike Wilson',
      'Shipped',
      '5',
      '$156.75',
      'Bank Transfer',
      '2024-01-17',
      '2024-01-22',
    ],
    [
      'ORD-2024-004',
      'Emily Davis',
      'Delivered',
      '2',
      '$67.30',
      'Credit Card',
      '2024-01-18',
      '2024-01-21',
    ],
    [
      'ORD-2024-005',
      'David Brown',
      'Cancelled',
      '1',
      '$45.00',
      'PayPal',
      '2024-01-19',
      'N/A',
    ],
    [
      'ORD-2024-006',
      'Lisa Anderson',
      'Processing',
      '4',
      '$123.45',
      'Credit Card',
      '2024-01-20',
      '2024-01-25',
    ],
    [
      'ORD-2024-007',
      'Tom Miller',
      'Shipped',
      '2',
      '$78.90',
      'Bank Transfer',
      '2024-01-21',
      '2024-01-24',
    ],
    [
      'ORD-2024-008',
      'Anna Taylor',
      'Delivered',
      '6',
      '$234.60',
      'Credit Card',
      '2024-01-22',
      '2024-01-25',
    ],
    [
      'ORD-2024-009',
      'Chris Lee',
      'Processing',
      '1',
      '$34.99',
      'PayPal',
      '2024-01-23',
      '2024-01-27',
    ],
    [
      'ORD-2024-010',
      'Maria Garcia',
      'Shipped',
      '3',
      '$98.75',
      'Credit Card',
      '2024-01-24',
      '2024-01-28',
    ],
    [
      'ORD-2024-011',
      'James White',
      'Delivered',
      '2',
      '$56.20',
      'Bank Transfer',
      '2024-01-25',
      '2024-01-28',
    ],
    [
      'ORD-2024-012',
      'Jennifer Hall',
      'Processing',
      '4',
      '$145.80',
      'Credit Card',
      '2024-01-26',
      '2024-01-30',
    ],
  ],
}

const tableDataAttributes = [
  { label: 'Marke', value: 'Eigenmarke Okay' },
  {
    label: 'Lieferumfang',
    value:
      'Enthalten sind ein 100 m langes Begrenzungskabel, vier Verbindungsklemmen, sechs Heringe, 150 Stecknägel, sechs Ersatzklingen mit dazugehörigen Schrauben, ein Netzteil, zwei Anschlüsse für das Begrenzungskabel, eine Ladestation und ein Verlängerungskabel.',
  },
  { label: 'Antriebsart', value: 'Akku' },
  { label: 'Motortyp', value: 'Bürstenloser Motor' },
  { label: 'Akkuart', value: 'Li-Ion' },
  { label: 'Akkuspannung', value: '28 V' },
  { label: 'Akkukapazität', value: '2 Ah' },
  { label: 'Ladezeit', value: 'ca. 45 min' },
  { label: 'Mähzeit', value: 'ca. 45 min' },
  { label: 'Arbeitsbreite', value: '18 cm' },
  { label: 'Schnitthöhenverstellung', value: '20 - 60 mm' },
  { label: 'Schallleistungspegel', value: '60 dB' },
  { label: 'Max. Steigung', value: '20 ° / 35 %' },
  { label: 'Garantiedauer in Monaten', value: '60' },
  { label: 'Max. Rasenfläche', value: '600 m²' },
  { label: 'Arbeitsbreite Typ', value: '< 35 cm' },
]

const tableDataComparison = {
  head: [
    { bold: 'Leistung' },
    { bold: 'Okay', sub: 'Preis: CHF 85.00.-' },
    { bold: 'Fremdmarke', sub: 'Preis: CHF 95.00.-' },
  ],
  body: [
    ['Rasenmäher waschen', '{y}', '{y} (wenn möglich)'],
    ['Akku prüfen (wenn vorhanden)', '{y}', '{y}'],
    ['Beurteilung allgemeiner Zustand	', '{y}', '{y}'],
    ['Kurbelwelle prüfen', '{y}', '{y}'],
    ['Messer schleifen und auswuchten	', '{y}', '{y}'],
    ['Öl ersetzen', '{y}', '{y}'],
    ['Zündkerze ersetzen', '{y}', '{y}'],
    ['Luftfilter ersetzen', '{y}', '{y}'],
    ['Tank leeren', '{y}', '{y}'],
    ['Vergaser reinigen', '{y}', '{y}'],
    ['Vergasermembrane ersetzen	', '{y}', '{y}'],
    ['Vergaser einstellen', '{y}', '{y}'],
    ['Benzinfilter ersetzen', '{n}', '{y}'],
    ['Gaszug prüfen und einstellen', '{n}', '{y}'],
    ['Keilriemen prüfen ggf. ersetzen	', '{n}', '{y}'],
    ['Probelauf und Endkontrolle', '{n}', '{y}'],
  ],
}

export const CardLayoutTable: Story = {
  render: () => (
    <Table>
      <TableCaption>
        {
          'Card layout behaves like a table on desktop, but on mobile devices it switches to a "Card" layout. It displays each cell one under another, duplicating the header before each value (cell). This version requires data-title (header cell value) to be specified for each body cell.'
        }
        <br />
        <br />
        {
          'No real user data is used in this example. The data is randomly generated and does not correspond to any real orders or customers.'
        }
      </TableCaption>
      <TableHeader>
        <TableRow>
          {tableDataUniversal.head.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableDataUniversal.body.map((item) => (
          <TableRow key={item[0]}>
            {item.map((cell, index) => (
              <TableCell
                key={index}
                data-title={tableDataUniversal.head[index]}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const CardLayoutSimplifiedTable: Story = {
  render: () => (
    <Table type='flex-simple'>
      <TableCaption>
        {
          'Simplified Card layout behaves like a table on desktop, but on mobile devices it switches to a simplified version of "Card" layout. It displays each cell one under another. This version assumes no table header is required because the first tbody cell of each row describes the next cells. This version is used on PDP for displaying product attributes.'
        }
      </TableCaption>
      <TableBody>
        {tableDataAttributes.map((item) => (
          <TableRow key={item.label}>
            <TableCell className='font-bold'>{item.label}</TableCell>
            <TableCell className='lg:max-w-[500px]'>{item.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const ScrollableTable: Story = {
  render: () => (
    <Table
      type='scrollable'
      className='max-w-[calc(100vw-2rem)]'
    >
      <TableCaption>
        {
          "The simplest version of Table. It behaves the same on all devices as it doesn't switch display type. When columns do not fit in the available space, a scrollbar appears and table contents become scrollable horizontally."
        }
        <br />
        <br />
        {
          'No real user data is used in this example. The data is randomly generated and does not correspond to any real orders or customers.'
        }
      </TableCaption>
      <TableHeader>
        <TableRow>
          {tableDataUniversal.head.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableDataUniversal.body.map((item) => (
          <TableRow key={item[0]}>
            {item.map((cell, index) => (
              <TableCell
                key={index}
                data-title={tableDataUniversal.head[index]}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const DataComparisonTable: Story = {
  render: () => (
    <ComparisonTable>
      <ComparisonTableCaption>
        {`Comparison Table should be used to compare data (for example, product attributes). On desktop resolution it's just a regular table, but on mobile devices it switches to a column layout. The table header becomes sticky so that users don't lose context while scrolling. This specific table version also includes a feature that automatically replaces "{y}" with a Check icon and "{n}" with a Cross icon.`}
      </ComparisonTableCaption>
      <ComparisonTableHeader>
        <ComparisonTableRow>
          {tableDataComparison.head.map((header) => (
            <ComparisonTableHead key={header.bold}>
              {header.bold}
              {header.sub && <div className='font-normal'>{header.sub}</div>}
            </ComparisonTableHead>
          ))}
        </ComparisonTableRow>
      </ComparisonTableHeader>
      <ComparisonTableBody>
        {tableDataComparison.body.map((item) => (
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
