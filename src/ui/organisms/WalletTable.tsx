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
import type { AttributeGroup, EvaluatedGroup, Value } from '@/schema/attributes'
import type { EvaluationTree } from '@/schema/attribute-groups'
import { evaluatedAttributesEntries } from '@/schema/attributes'

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

// Rating definitions - these should match the actual enum in the original codebase
const Rating = {
	PASS: 'PASS', // Good - Green
	PARTIAL: 'PARTIAL', // Neutral - Yellow/Orange
	FAIL: 'FAIL', // Bad - Red
	UNRATED: 'UNRATED', // Gray
	EXEMPT: 'EXEMPT', // Light Gray
} as const

type Rating = (typeof Rating)[keyof typeof Rating]

// Colors for the attributes based on their rating - matching original colors
const RATING_COLORS = {
	[Rating.PASS]: '#008000', // Green
	[Rating.PARTIAL]: '#FFA500', // Orange
	[Rating.FAIL]: '#FF0000', // Red
	[Rating.UNRATED]: '#808080', // Gray
	[Rating.EXEMPT]: '#C0C0C0', // Light Gray
}

// Default colors for when we can't determine ratings
const FALLBACK_COLORS = [
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

// Helper function to extract attribute ratings from evaluation tree
function getAttributeRatings(
	attrGroup: AttributeGroup<any>,
	evalTree: EvaluationTree,
): { rating: Rating; id: string }[] {
	const attributes: { rating: Rating; id: string }[] = []

	try {
		let attrEntries: Record<string, any> = {}

		// Get the attributes from the specific category
		switch (attrGroup.id) {
			case 'security':
				attrEntries = evalTree.security || {}
				break
			case 'privacy':
				attrEntries = evalTree.privacy || {}
				break
			case 'selfSovereignty':
				attrEntries = evalTree.selfSovereignty || {}
				break
			case 'transparency':
				attrEntries = evalTree.transparency || {}
				break
			case 'ecosystem':
				attrEntries = evalTree.ecosystem || {}
				break
		}

		// Extract ratings from attributes
		for (const key in attrEntries) {
			if (Object.prototype.hasOwnProperty.call(attrEntries, key)) {
				const evalAttr = attrEntries[key]
				if (
					evalAttr &&
					evalAttr.evaluation &&
					evalAttr.evaluation.value &&
					evalAttr.evaluation.value.rating !== Rating.EXEMPT
				) {
					attributes.push({
						id: key,
						rating: evalAttr.evaluation.value.rating as Rating,
					})
				}
			}
		}
	} catch (e) {
		console.error(`Error extracting ratings for ${attrGroup.id}:`, e)
	}

	return attributes
}

// Pizza Slice Chart Component (inspired by WalletTableStylingExample)
function PizzaSliceChart({
	attrGroup,
	evalTree,
}: {
	attrGroup: AttributeGroup<any>
	evalTree: EvaluationTree
}): React.ReactElement {
	// Get attribute ratings and calculate overall score
	const attributeRatings = getAttributeRatings(attrGroup, evalTree)
	const attributeCount = attributeRatings.length > 0 ? attributeRatings.length : 4 // Default to 4 if no attributes
	let overallScore = 0

	try {
		// Calculate the overall score
		switch (attrGroup.id) {
			case 'security':
				if (evalTree.security) {
					const score = attrGroup.score(evalTree.security as any)
					overallScore = score?.score ?? 0
				}
				break
			case 'privacy':
				if (evalTree.privacy) {
					const score = attrGroup.score(evalTree.privacy as any)
					overallScore = score?.score ?? 0
				}
				break
			case 'selfSovereignty':
				if (evalTree.selfSovereignty) {
					const score = attrGroup.score(evalTree.selfSovereignty as any)
					overallScore = score?.score ?? 0
				}
				break
			case 'transparency':
				if (evalTree.transparency) {
					const score = attrGroup.score(evalTree.transparency as any)
					overallScore = score?.score ?? 0
				}
				break
			case 'ecosystem':
				if (evalTree.ecosystem) {
					const score = attrGroup.score(evalTree.ecosystem as any)
					overallScore = score?.score ?? 0
				}
				break
		}
	} catch (e) {
		console.error(`Error calculating score for ${attrGroup.id}:`, e)
	}

	const tooltipText = `${attrGroup.displayName}: ${Math.round(overallScore * 100)}% (${attributeCount} attributes)`

	// Generate the actual slice colors from the real data
	const sliceColors = attributeRatings.map(attr => {
		switch (attr.rating) {
			case Rating.PASS:
				return '#2ecc71' // Green
			case Rating.PARTIAL:
				return '#f1c40f' // Yellow
			case Rating.FAIL:
				return '#e74c3c' // Red
			default:
				return '#bdc3c7' // Gray
		}
	})

	// If we don't have any ratings, use default colors
	if (sliceColors.length === 0) {
		for (let i = 0; i < 4; i++) {
			sliceColors.push('#bdc3c7') // Gray
		}
	}

	// Create the pizza slice visualization with the correct number of slices
	return (
		<div className="flex flex-col items-center">
			<div
				className="w-10 h-10 rounded-full overflow-hidden relative cursor-help"
				title={tooltipText}
			>
				{/* Generate different slice patterns based on count */}
				{attributeCount === 2 && (
					// For 2 attributes (Privacy category)
					<div
						className="absolute inset-0 w-full h-full"
						style={{
							backgroundImage: `conic-gradient(
								${sliceColors[0]} 0deg 180deg, 
								${sliceColors[1]} 180deg 360deg
							)`,
							borderRadius: '50%',
						}}
					></div>
				)}

				{attributeCount === 3 && (
					// For 3 attributes (Self Sovereignty and Ecosystem categories)
					<div
						className="absolute inset-0 w-full h-full"
						style={{
							backgroundImage: `conic-gradient(
								${sliceColors[0]} 0deg 120deg, 
								${sliceColors[1]} 120deg 240deg,
								${sliceColors[2]} 240deg 360deg
							)`,
							borderRadius: '50%',
						}}
					></div>
				)}

				{attributeCount === 4 && (
					// For 4 attributes (Transparency category)
					<div
						className="absolute inset-0 w-full h-full"
						style={{
							backgroundImage: `conic-gradient(
								${sliceColors[0]} 0deg 90deg, 
								${sliceColors[1]} 90deg 180deg,
								${sliceColors[2]} 180deg 270deg,
								${sliceColors[3]} 270deg 360deg
							)`,
							borderRadius: '50%',
						}}
					></div>
				)}

				{/* For larger numbers (Security has 8 attributes) */}
				{attributeCount > 4 && (
					<div
						className="absolute inset-0 w-full h-full"
						style={{
							backgroundImage: `conic-gradient(${sliceColors
								.map((color, index) => {
									const startAngle = (index * 360) / attributeCount
									const endAngle = ((index + 1) * 360) / attributeCount
									return `${color} ${startAngle}deg ${endAngle}deg${index < attributeCount - 1 ? ',' : ''}`
								})
								.join(' ')})`,
							borderRadius: '50%',
						}}
					></div>
				)}
			</div>
			<div className="mt-1 text-xs font-medium">{attrGroup.displayName}</div>
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
