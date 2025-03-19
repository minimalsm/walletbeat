/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions - Disabled for integration with tanstack table */
import React from 'react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	getExpandedRowModel,
} from '@tanstack/react-table'
import { ratedWallets } from '@/data/wallets'
import {
	securityAttributeGroup,
	privacyAttributeGroup,
	selfSovereigntyAttributeGroup,
	transparencyAttributeGroup,
	ecosystemAttributeGroup,
} from '@/schema/attribute-groups'
import type { AttributeGroup } from '@/schema/attributes'
import type { EvaluationTree } from '@/schema/attribute-groups'

// Define wallet type constants from the previous implementation
const WalletTypeCategory = {
	EOA: 'EOA',
	SMART_WALLET: 'SMART_WALLET',
	HARDWARE_WALLET: 'HARDWARE_WALLET',
} as const

type WalletTypeCategory = (typeof WalletTypeCategory)[keyof typeof WalletTypeCategory]

const SmartWalletStandard = {
	ERC_4337: 'ERC_4337',
	ERC_7702: 'ERC_7702',
	OTHER: 'OTHER',
} as const

type SmartWalletStandard = (typeof SmartWalletStandard)[keyof typeof SmartWalletStandard]

const WALLET_TYPE_DISPLAY: Record<WalletTypeCategory, string> = {
	[WalletTypeCategory.EOA]: 'EOA',
	[WalletTypeCategory.SMART_WALLET]: 'SW',
	[WalletTypeCategory.HARDWARE_WALLET]: 'HW',
}

const SMART_WALLET_STANDARD_DISPLAY: Record<SmartWalletStandard, string> = {
	[SmartWalletStandard.ERC_4337]: 'ERC-4337',
	[SmartWalletStandard.ERC_7702]: 'ERC-7702',
	[SmartWalletStandard.OTHER]: 'Other',
}

// Rating definitions and styling for the simplified rating pie charts
const Rating = {
	GOOD: 'GOOD',
	NEUTRAL: 'NEUTRAL',
	BAD: 'BAD',
	EXEMPT: 'EXEMPT',
} as const

type Rating = (typeof Rating)[keyof typeof Rating]

// Colors for the rating pie slices
const RATING_COLORS = {
	[Rating.GOOD]: '#4caf50', // Green
	[Rating.NEUTRAL]: '#ff9800', // Orange
	[Rating.BAD]: '#f44336', // Red
	[Rating.EXEMPT]: '#9e9e9e', // Gray
}

// Helper functions for wallet data
interface WalletInfo {
	categories: WalletTypeCategory[]
	standards: SmartWalletStandard[]
	isMultiType: boolean
}

// Helper type for wallet metadata access
interface WalletMetadataLike {
	id: string
	displayName: string
	url?: string
	walletType?: {
		category?: WalletTypeCategory
		smartWalletStandard?: SmartWalletStandard
	}
	multiWalletType?: {
		categories?: WalletTypeCategory[]
		smartWalletStandards?: SmartWalletStandard[]
	}
}

interface WalletLike {
	metadata: WalletMetadataLike
	overall: EvaluationTree
}

// Helper function to get wallet type information
function getWalletTypeInfo(wallet: WalletLike): WalletInfo {
	const walletType = wallet.metadata.walletType ?? {}
	const category = walletType.category ?? WalletTypeCategory.EOA
	const standards: SmartWalletStandard[] = []

	if (category === WalletTypeCategory.SMART_WALLET && walletType.smartWalletStandard) {
		standards.push(walletType.smartWalletStandard)
	}

	// Also check for multiWalletType
	if (wallet.metadata.multiWalletType) {
		const multiType = wallet.metadata.multiWalletType
		const categories = multiType.categories ?? []
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
function getDetailedWalletDescription(wallet: WalletLike): string {
	const { categories, standards } = getWalletTypeInfo(wallet)

	const typeDescriptions: string[] = []

	if (categories.includes(WalletTypeCategory.EOA)) {
		typeDescriptions.push('Externally Owned Account')
	}

	if (categories.includes(WalletTypeCategory.SMART_WALLET)) {
		const standardsStr =
			standards.length > 0
				? `(${standards.map(std => SMART_WALLET_STANDARD_DISPLAY[std] ?? std).join(', ')})`
				: ''
		typeDescriptions.push(`Smart Wallet ${standardsStr}`)
	}

	if (categories.includes(WalletTypeCategory.HARDWARE_WALLET)) {
		typeDescriptions.push('Hardware Wallet')
	}

	return typeDescriptions.join(' + ')
}

// Simplified rating pie chart component
function SimplifiedRatingPie({
	attrGroup,
	evalTree,
}: {
	attrGroup: AttributeGroup<any>
	evalTree: EvaluationTree
}): React.ReactElement {
	// Get the group score from attribute group
	let score = 0
	let tooltipText = ''

	// Based on the attribute group, compute the score
	try {
		switch (attrGroup.id) {
			case 'security':
				score = (evalTree.security && attrGroup.score(evalTree.security as any)?.score) ?? 0
				tooltipText = `Security Score: ${Math.round(score * 100)}%`
				break
			case 'privacy':
				score = (evalTree.privacy && attrGroup.score(evalTree.privacy as any)?.score) ?? 0
				tooltipText = `Privacy Score: ${Math.round(score * 100)}%`
				break
			case 'selfSovereignty':
				score =
					(evalTree.selfSovereignty && attrGroup.score(evalTree.selfSovereignty as any)?.score) ?? 0
				tooltipText = `Self Sovereignty Score: ${Math.round(score * 100)}%`
				break
			case 'transparency':
				score = (evalTree.transparency && attrGroup.score(evalTree.transparency as any)?.score) ?? 0
				tooltipText = `Transparency Score: ${Math.round(score * 100)}%`
				break
			case 'ecosystem':
				score = (evalTree.ecosystem && attrGroup.score(evalTree.ecosystem as any)?.score) ?? 0
				tooltipText = `Ecosystem Score: ${Math.round(score * 100)}%`
				break
		}
	} catch (e) {
		// Fallback in case of error
		console.error(`Error calculating score for ${attrGroup.id}:`, e)
	}

	// Determine color based on score
	let color = RATING_COLORS[Rating.NEUTRAL]
	if (score >= 0.7) {
		color = RATING_COLORS[Rating.GOOD]
	} else if (score <= 0.3) {
		color = RATING_COLORS[Rating.BAD]
	}

	// Create a simplified pie chart with CSS
	return (
		<div className="flex flex-col items-center">
			<div
				className="h-16 w-16 rounded-full flex items-center justify-center cursor-help"
				style={{ background: `conic-gradient(${color} ${score * 360}deg, #e5e5e5 0)` }}
				title={tooltipText}
			>
				<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-sm">
					{score > 0 ? `${Math.round(score * 100)}%` : 'N/A'}
				</div>
			</div>
			<div className="mt-1 text-sm font-medium">{attrGroup.displayName}</div>
		</div>
	)
}

// TableRow interface for better type safety
interface TableRow {
	id: string
	name: string
	wallet: WalletLike
	subRows: TableRow[]
}

// Create table data
const defaultData: TableRow[] = Object.values(ratedWallets).map(wallet => {
	const detailedType = getDetailedWalletDescription(wallet as WalletLike)
	const { categories, standards } = getWalletTypeInfo(wallet as WalletLike)

	// Format wallet standards for display
	const standardsDisplay =
		standards.length > 0
			? standards.map(std => SMART_WALLET_STANDARD_DISPLAY[std] ?? std).join(', ')
			: 'None'

	return {
		id: wallet.metadata.id,
		name: wallet.metadata.displayName,
		wallet: wallet as WalletLike,
		// Each wallet row has a subRow for details
		subRows: [
			{
				id: wallet.metadata.id + '-detail',
				name: 'Details',
				wallet: wallet as WalletLike,
				// Additional metadata for detail display
				typeDescription: detailedType,
				standards: standardsDisplay,
				websiteUrl: wallet.metadata.url ?? 'Not available',
				// Empty subRows for detail rows (they can't be expanded further)
				subRows: [],
			} as TableRow & {
				typeDescription: string
				standards: string
				websiteUrl: string
			},
		],
	}
})

// Define columns
const columns = [
	{
		header: 'Wallet',
		accessorKey: 'name',
		cell: ({ row, getValue }: { row: any; getValue: () => any }) => {
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
		accessorFn: (row: any) => {
			if (row.id.endsWith('-detail')) {
				return null
			}

			const { categories } = getWalletTypeInfo(row.wallet)
			return categories.map(cat => WALLET_TYPE_DISPLAY[cat] ?? cat).join(' & ')
		},
		cell: (info: any) => info.getValue(),
	},
	// Add the five category columns
	{
		header: 'Security',
		accessorFn: (row: any) => {
			if (row.id.endsWith('-detail')) {
				return null
			}
			return 'security'
		},
		cell: (info: any) => {
			if (!info.getValue()) {
				return null
			}
			return (
				<SimplifiedRatingPie
					attrGroup={securityAttributeGroup}
					evalTree={info.row.original.wallet.overall}
				/>
			)
		},
	},
	{
		header: 'Privacy',
		accessorFn: (row: any) => {
			if (row.id.endsWith('-detail')) {
				return null
			}
			return 'privacy'
		},
		cell: (info: any) => {
			if (!info.getValue()) {
				return null
			}
			return (
				<SimplifiedRatingPie
					attrGroup={privacyAttributeGroup}
					evalTree={info.row.original.wallet.overall}
				/>
			)
		},
	},
	{
		header: 'Self Sovereignty',
		accessorFn: (row: any) => {
			if (row.id.endsWith('-detail')) {
				return null
			}
			return 'selfSovereignty'
		},
		cell: (info: any) => {
			if (!info.getValue()) {
				return null
			}
			return (
				<SimplifiedRatingPie
					attrGroup={selfSovereigntyAttributeGroup}
					evalTree={info.row.original.wallet.overall}
				/>
			)
		},
	},
	{
		header: 'Transparency',
		accessorFn: (row: any) => {
			if (row.id.endsWith('-detail')) {
				return null
			}
			return 'transparency'
		},
		cell: (info: any) => {
			if (!info.getValue()) {
				return null
			}
			return (
				<SimplifiedRatingPie
					attrGroup={transparencyAttributeGroup}
					evalTree={info.row.original.wallet.overall}
				/>
			)
		},
	},
	{
		header: 'Ecosystem',
		accessorFn: (row: any) => {
			if (row.id.endsWith('-detail')) {
				return null
			}
			return 'ecosystem'
		},
		cell: (info: any) => {
			if (!info.getValue()) {
				return null
			}
			return (
				<SimplifiedRatingPie
					attrGroup={ecosystemAttributeGroup}
					evalTree={info.row.original.wallet.overall}
				/>
			)
		},
	},
]

export default function WalletTable(): React.ReactElement {
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
