import type { ReactElement } from 'react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Box, Tooltip } from '@mui/material'

// Replace with your actual data source
import { ratedWallets } from '@/data/wallets'
import { WalletNameCell } from '@/ui/molecules/WalletNameCell'
import { WalletRatingCell } from '@/ui/molecules/WalletRatingCell'

// Prepare data for the table (adjust the mapping as needed)
const data = Object.values(ratedWallets).map(wallet => ({
	id: wallet.metadata.id,
	// We include the full wallet object for custom renderers
	wallet,
	displayName: wallet.metadata.displayName,
	// Use wallet type or default to 'EOA'
	walletType: wallet.metadata.walletType?.category ?? 'EOA',
	// For example, we assume a "security" rating is available
	securityRating: wallet.overall?.security?.score ?? 0,
}))

// Define columns for the table
const columns: Array<ColumnDef<(typeof data)[number]>> = [
	{
		accessorKey: 'displayName',
		header: 'Wallet',
		cell: info => {
			// Use your custom WalletNameCell component
			return <WalletNameCell wallet={info.row.original.wallet} />
		},
	},
	{
		accessorKey: 'walletType',
		header: 'Type',
		cell: info => {
			const wallet = info.row.original.wallet
			// For demonstration, we assume the wallet type object has a "detail" field
			const detailedText =
				wallet.metadata.walletType?.detail ?? wallet.metadata.walletType?.category ?? 'EOA'
			return (
				<Tooltip title={detailedText} arrow placement="top">
					<Box>{info.getValue() as string}</Box>
				</Tooltip>
			)
		},
	},
	{
		accessorKey: 'securityRating',
		header: 'Security',
		cell: info => {
			// Render a rating cell for the "security" attribute
			const wallet = info.row.original.wallet
			return <WalletRatingCell wallet={wallet} attribute="security" />
		},
	},
]

export default function WalletTable(): ReactElement {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<div style={{ padding: '1rem' }}>
			<table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
				<thead>
					{table.getHeaderGroups().map(headerGroup => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map(header => (
								<th key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map(row => (
						<tr key={row.id}>
							{row.getVisibleCells().map(cell => (
								<td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
