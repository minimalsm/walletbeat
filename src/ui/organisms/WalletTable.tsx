/* eslint-disable @typescript-eslint/strict-boolean-expressions - Required for conditional rendering */
/* eslint-disable @typescript-eslint/no-unsafe-member-access - Required for accessing row properties */
import React from 'react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	getExpandedRowModel,
} from '@tanstack/react-table'
import { ratedWallets } from '@/data/wallets'

// Define wallet type constants from the previous implementation
const WalletTypeCategory = {
	EOA: 'EOA',
	SMART_WALLET: 'SMART_WALLET',
	HARDWARE_WALLET: 'HARDWARE_WALLET',
}

const SmartWalletStandard = {
	ERC_4337: 'ERC_4337',
	ERC_7702: 'ERC_7702',
	OTHER: 'OTHER',
}

const WALLET_TYPE_DISPLAY = {
	[WalletTypeCategory.EOA]: 'EOA',
	[WalletTypeCategory.SMART_WALLET]: 'SW',
	[WalletTypeCategory.HARDWARE_WALLET]: 'HW',
}

const SMART_WALLET_STANDARD_DISPLAY = {
	[SmartWalletStandard.ERC_4337]: 'ERC-4337',
	[SmartWalletStandard.ERC_7702]: 'ERC-7702',
	[SmartWalletStandard.OTHER]: 'Other',
}

// Helper function to get wallet type information
function getWalletTypeInfo(wallet) {
	const walletType = wallet.metadata.walletType || {}
	const category = walletType.category || WalletTypeCategory.EOA
	const standards = []

	if (category === WalletTypeCategory.SMART_WALLET && walletType.smartWalletStandard) {
		standards.push(walletType.smartWalletStandard)
	}

	// Also check for multiWalletType
	if (wallet.metadata.multiWalletType) {
		const multiType = wallet.metadata.multiWalletType
		const categories = multiType.categories || []
		if (multiType.smartWalletStandards) {
			standards.push(...multiType.smartWalletStandards)
		}
		return {
			categories,
			standards,
			isMultiType: true,
		}
	}

	return {
		categories: [category],
		standards,
		isMultiType: false,
	}
}

// Helper function to get a detailed description of the wallet
function getDetailedWalletDescription(wallet) {
	const { categories, standards } = getWalletTypeInfo(wallet)

	const typeDescriptions = []

	if (categories.includes(WalletTypeCategory.EOA)) {
		typeDescriptions.push('Externally Owned Account')
	}

	if (categories.includes(WalletTypeCategory.SMART_WALLET)) {
		const standardsStr =
			standards.length > 0
				? `(${standards.map(std => SMART_WALLET_STANDARD_DISPLAY[std] || std).join(', ')})`
				: ''
		typeDescriptions.push(`Smart Wallet ${standardsStr}`)
	}

	if (categories.includes(WalletTypeCategory.HARDWARE_WALLET)) {
		typeDescriptions.push('Hardware Wallet')
	}

	return typeDescriptions.join(' + ')
}

// Create table data
const defaultData = Object.values(ratedWallets).map(wallet => {
	const detailedType = getDetailedWalletDescription(wallet)
	const { categories, standards } = getWalletTypeInfo(wallet)

	// Format wallet standards for display
	const standardsDisplay =
		standards.length > 0
			? standards.map(std => SMART_WALLET_STANDARD_DISPLAY[std] || std).join(', ')
			: 'None'

	// Create wallet type display
	const typeDisplay = categories.map(cat => WALLET_TYPE_DISPLAY[cat] || cat).join(' & ')

	return {
		id: wallet.metadata.id,
		name: wallet.metadata.displayName,
		wallet: wallet,
		// Each wallet row has a subRow for details
		subRows: [
			{
				id: wallet.metadata.id + '-detail',
				name: 'Details',
				wallet: wallet,
				// Additional metadata for detail display
				typeDescription: detailedType,
				standards: standardsDisplay,
				websiteUrl: wallet.metadata.websiteUrl || 'Not available',
				// Empty subRows for detail rows (they can't be expanded further)
				subRows: [],
			},
		],
	}
})

// Define columns
const columns = [
	{
		header: 'Wallet',
		accessorKey: 'name',
		cell: ({ row, getValue }) => {
			// Check if this is a detail row
			const isDetailRow = row.original.id.endsWith('-detail')

			if (isDetailRow) {
				// Render detailed metadata for detail rows
				const metadata = row.original
				return (
					<div className="p-3 bg-gray-50 rounded">
						<div className="grid grid-cols-2 gap-2">
							<div className="font-semibold">Type:</div>
							<div>{metadata.typeDescription}</div>

							<div className="font-semibold">Standards:</div>
							<div>{metadata.standards}</div>

							<div className="font-semibold">Website:</div>
							<div>
								{metadata.websiteUrl !== 'Not available' ? (
									<a
										href={metadata.websiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:underline"
									>
										{metadata.websiteUrl}
									</a>
								) : (
									'Not available'
								)}
							</div>
						</div>
					</div>
				)
			}

			// Regular row rendering with expand/collapse button
			return (
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
			)
		},
	},
	{
		header: 'Type',
		accessorFn: row => {
			if (row.id.endsWith('-detail')) {
				return null
			}

			const { categories } = getWalletTypeInfo(row.wallet)
			return categories.map(cat => WALLET_TYPE_DISPLAY[cat] || cat).join(' & ')
		},
		cell: info => info.getValue(),
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
						<tr key={row.id} className={row.original.id.endsWith('-detail') ? 'bg-gray-50' : ''}>
							{row.getVisibleCells().map(cell => (
								<td
									key={cell.id}
									className="px-4 py-2"
									colSpan={row.original.id.endsWith('-detail') && cell.column.id === '0' ? 2 : 1}
								>
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
