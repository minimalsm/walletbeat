/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	getExpandedRowModel,
} from '@tanstack/react-table'
import { ratedWallets } from '@/data/wallets'
import { useState } from 'react'

const defaultData = Object.values(ratedWallets).map(wallet => ({
	id: wallet.metadata.id,
	name: wallet.metadata.displayName,
	wallet: wallet,
	// Each wallet row has a subRow for details
	subRows: [
		{
			id: wallet.metadata.id + '-detail',
			name: 'Details',
			wallet: wallet,
			isDetailRow: true,
		},
	],
}))

// Define columns
const columns = [
	{
		header: 'Wallet',
		accessorKey: 'name',
		cell: ({ row, getValue }) => (
			<div style={{ paddingLeft: row.depth * 20 }}>
				{row.getCanExpand() ? (
					<button
						onClick={row.getToggleExpandedHandler()}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '0 4px',
						}}
					>
						{row.getIsExpanded() ? '▼' : '▶'}
					</button>
				) : (
					<span style={{ display: 'inline-block', width: 18 }} />
				)}{' '}
				{getValue()}
			</div>
		),
	},
]

export default function WalletTable() {
	const [data] = React.useState(() => [...defaultData])

	// Create table
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: row => row.subRows,
	})

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead>
					{table.getHeaderGroups().map(headerGroup => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map(header => (
								<th key={header.id} className="px-4 py-2 text-left font-semibold bg-gray-100">
									{flexRender(header.column.columnDef.header, header.getContext())}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody className="divide-y divide-gray-200">
					{table.getRowModel().rows.map(row => (
						<tr key={row.id}>
							{row.getVisibleCells().map(cell => (
								<td key={cell.id} className="px-4 py-2">
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
