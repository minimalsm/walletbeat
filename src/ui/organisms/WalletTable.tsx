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

// Rating definitions and styling for the pie charts
const Rating = {
	GOOD: 'GOOD',
	NEUTRAL: 'NEUTRAL',
	BAD: 'BAD',
	EXEMPT: 'EXEMPT',
} as const

type Rating = (typeof Rating)[keyof typeof Rating]

// Colors for the attribute segments
const ATTRIBUTE_COLORS = {
	[Rating.GOOD]: '#2ecc71', // Green
	[Rating.NEUTRAL]: '#f1c40f', // Yellow
	[Rating.BAD]: '#e74c3c', // Red
	[Rating.EXEMPT]: '#bdc3c7', // Gray
}

// Preset colors for pizza slices
const SLICE_COLORS = [
	'#e74c3c', // Red
	'#2ecc71', // Green
	'#f1c40f', // Yellow
	'#bdc3c7', // Gray
	'#3498db', // Blue
	'#9b59b6', // Purple
	'#1abc9c', // Teal
	'#e67e22', // Orange
]

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

// Pizza Slice Chart Component (inspired by WalletTableStylingExample)
function PizzaSliceChart({
	attrGroup,
	evalTree,
}: {
	attrGroup: AttributeGroup<any>
	evalTree: EvaluationTree
}): React.ReactElement {
	// Get the attribute count for this group to determine the number of slices
	let attributeCount = 0
	let overallScore = 0
	let attributeScores: { rating: Rating; score: number }[] = []
	let tooltipText = ''

	try {
		switch (attrGroup.id) {
			case 'security':
				// Security has 8 attributes
				attributeCount = 8
				overallScore = (evalTree.security && attrGroup.score(evalTree.security as any)?.score) ?? 0
				tooltipText = `Security: ${Math.round(overallScore * 100)}%`
				break
			case 'privacy':
				// Privacy has 2 attributes
				attributeCount = 2
				overallScore = (evalTree.privacy && attrGroup.score(evalTree.privacy as any)?.score) ?? 0
				tooltipText = `Privacy: ${Math.round(overallScore * 100)}%`
				break
			case 'selfSovereignty':
				// Self Sovereignty has 3 attributes
				attributeCount = 3
				overallScore =
					(evalTree.selfSovereignty && attrGroup.score(evalTree.selfSovereignty as any)?.score) ?? 0
				tooltipText = `Self Sovereignty: ${Math.round(overallScore * 100)}%`
				break
			case 'transparency':
				// Transparency has 4 attributes
				attributeCount = 4
				overallScore =
					(evalTree.transparency && attrGroup.score(evalTree.transparency as any)?.score) ?? 0
				tooltipText = `Transparency: ${Math.round(overallScore * 100)}%`
				break
			case 'ecosystem':
				// Ecosystem has 3 attributes
				attributeCount = 3
				overallScore =
					(evalTree.ecosystem && attrGroup.score(evalTree.ecosystem as any)?.score) ?? 0
				tooltipText = `Ecosystem: ${Math.round(overallScore * 100)}%`
				break
		}

		// Convert the overall score to a rating for color
		let overallRating = Rating.NEUTRAL
		if (overallScore >= 0.7) {
			overallRating = Rating.GOOD
		} else if (overallScore <= 0.3) {
			overallRating = Rating.BAD
		}

		// For simplicity, generate some simulated attribute scores
		for (let i = 0; i < attributeCount; i++) {
			// Use the overall rating with some variation to simulate individual attributes
			const randomFactor = Math.random() * 0.4 - 0.2 // Random factor between -0.2 and 0.2
			const score = Math.max(0, Math.min(1, overallScore + randomFactor))
			let rating = Rating.NEUTRAL

			if (score >= 0.7) {
				rating = Rating.GOOD
			} else if (score <= 0.3) {
				rating = Rating.BAD
			}

			attributeScores.push({ rating, score })
		}
	} catch (e) {
		// Fallback in case of error
		attributeCount = 4 // Default to 4 slices
		console.error(`Error calculating score for ${attrGroup.id}:`, e)
	}

	// Create the pizza slice visualization
	return (
		<div className="flex flex-col items-center">
			<div
				className="w-16 h-16 rounded-full overflow-hidden relative cursor-help"
				title={tooltipText}
			>
				{/* Generate pie slices based on attribute count */}
				{Array.from({ length: attributeCount }).map((_, index) => {
					const angleDegrees = 360 / attributeCount
					const startAngle = index * angleDegrees
					const sliceColor = SLICE_COLORS[index % SLICE_COLORS.length]

					// For 2 slices (like privacy), use a simple 50/50 split
					if (attributeCount === 2) {
						return index === 0 ? (
							<div
								key={index}
								className="absolute w-1/2 h-full top-0 left-0 bg-red-500"
								style={{ backgroundColor: sliceColor }}
							></div>
						) : (
							<div
								key={index}
								className="absolute w-1/2 h-full top-0 right-0 bg-green-500"
								style={{ backgroundColor: sliceColor }}
							></div>
						)
					}

					// For 4 slices (standard pie chart quadrants)
					if (attributeCount === 4) {
						const positions = [
							'absolute w-1/2 h-1/2 top-0 left-0 rounded-tl-full',
							'absolute w-1/2 h-1/2 top-0 right-0 rounded-tr-full',
							'absolute w-1/2 h-1/2 bottom-0 right-0 rounded-br-full',
							'absolute w-1/2 h-1/2 bottom-0 left-0 rounded-bl-full',
						]

						return (
							<div
								key={index}
								className={positions[index]}
								style={{ backgroundColor: sliceColor }}
							></div>
						)
					}

					// For other counts, use conic-gradient
					// For 3 slices, we need to handle this specially
					if (attributeCount === 3) {
						const positions = [
							'absolute w-1/2 h-1/2 top-0 left-0 rounded-tl-full',
							'absolute w-1/2 h-1/2 top-0 right-0 rounded-tr-full',
							'absolute w-full h-1/2 bottom-0 left-0',
						]

						return (
							<div
								key={index}
								className={positions[index]}
								style={{ backgroundColor: sliceColor }}
							></div>
						)
					}

					// Default: Just show the whole element with a radial background
					// This is a fallback for other odd numbers of attributes
					return (
						<div
							key={index}
							className="absolute"
							style={{
								width: '100%',
								height: '100%',
								backgroundColor: sliceColor,
								clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle * Math.PI) / 180)}% ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((startAngle + angleDegrees) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((startAngle + angleDegrees) * Math.PI) / 180)}%)`,
							}}
						></div>
					)
				})}

				{/* Center overlay for score display */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-xs font-medium">
						{Math.round(overallScore * 100)}%
					</div>
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
				<PizzaSliceChart
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
				<PizzaSliceChart
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
				<PizzaSliceChart
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
				<PizzaSliceChart
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
				<PizzaSliceChart
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
