/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions - Disabled for integration with tanstack table */
import React, { useState } from 'react'
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
import { Rating, type AttributeGroup } from '@/schema/attributes'
import type { EvaluationTree } from '@/schema/attribute-groups'
import { RatingDetailModal } from '../molecules/RatingDetailModal'

// Define wallet type constants from the previous implementation
const WalletTypeCategory = {
	EOA: 'EOA',
	SMART_WALLET: 'SMART_WALLET',
	HARDWARE_WALLET: 'HARDWARE_WALLET',
} as const

// Define device variants for device selector
const DeviceVariant = {
	NONE: 'none',
	WEB: 'browser',
	MOBILE: 'mobile',
	DESKTOP: 'desktop',
} as const

type DeviceVariant = (typeof DeviceVariant)[keyof typeof DeviceVariant]

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
	// Add properties for variants
	variants?: Record<string, any>
}

interface WalletLike {
	metadata: WalletMetadataLike
	overall: EvaluationTree
	variants?: Record<string, { attributes: EvaluationTree }>
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

// Helper function to check if wallet supports a specific device variant
function walletSupportsVariant(wallet: WalletLike, variant: DeviceVariant): boolean {
	if (variant === DeviceVariant.NONE) {
		return true
	}
	return Boolean(wallet.variants && variant in wallet.variants)
}

// Helper function to get device-specific evaluation tree
function getEvaluationTree(wallet: WalletLike, selectedVariant: DeviceVariant): EvaluationTree {
	if (selectedVariant === DeviceVariant.NONE || !wallet.variants) {
		return wallet.overall
	}

	const variantData = wallet.variants[selectedVariant]
	return variantData ? variantData.attributes : wallet.overall
}

// Helper function to extract attribute ratings from evaluation tree
function getAttributeRatings(
	attrGroup: AttributeGroup<any>,
	evalTree: EvaluationTree,
): { rating: Rating; id: string }[] {
	const attributes: { rating: Rating; id: string }[] = []

	try {
		// Get the category key and data safely
		const categoryKey = attrGroup.id as keyof EvaluationTree
		const categoryData = evalTree[categoryKey]

		if (!categoryData) {
			return attributes
		}

		// We need to handle the categoryData as a dynamic object
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dataObj = categoryData as Record<string, any>

		// Extract ratings from attributes
		for (const key in dataObj) {
			if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
				const evalAttr = dataObj[key]

				// Check if evaluation data is present and has a rating
				if (evalAttr?.evaluation?.value?.rating !== undefined) {
					const rating = evalAttr.evaluation.value.rating

					// Skip exempt ratings
					if (rating !== Rating.EXEMPT) {
						attributes.push({
							id: key,
							rating: rating as Rating,
						})
					}
				}
			}
		}
	} catch (e) {
		// eslint-disable-next-line no-console -- Error logging needed for debugging
		console.error(`Error extracting ratings for ${attrGroup.id}:`, e)
	}

	return attributes
}

// Pizza Slice Chart Component (inspired by WalletTableStylingExample)
function PizzaSliceChart({
	attrGroup,
	evalTree,
	isSupported = true,
}: {
	attrGroup: AttributeGroup<any>
	evalTree: EvaluationTree
	isSupported?: boolean
}): React.ReactElement {
	// Add state for the modal
	const [modalOpen, setModalOpen] = useState(false)

	// Get attribute ratings and calculate overall score
	const attributeRatings = getAttributeRatings(attrGroup, evalTree)
	const attributeCount = attributeRatings.length > 0 ? attributeRatings.length : 4 // Default to 4 if no attributes
	let overallScore = 0

	try {
		// Calculate the overall score safely
		const categoryKey = attrGroup.id as keyof EvaluationTree
		const categoryData = evalTree[categoryKey]

		// Only proceed if we have both category data and a score function
		if (!categoryData || typeof attrGroup.score !== 'function') {
			// If missing data, leave overallScore as 0
		} else {
			// Type assertions needed due to complexity of types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
			const scoreResult = attrGroup.score(categoryData as any)

			// Check for valid score result with safe object property access
			if (typeof scoreResult === 'object' && scoreResult !== null && 'score' in scoreResult) {
				// Safe access to score property
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				overallScore = scoreResult.score
			}
		}
	} catch (e) {
		// eslint-disable-next-line no-console -- Error logging needed for debugging
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

	// Create SVG slices for cleaner rendering with gaps
	const createSlices = () => {
		const slices = []
		const centerX = 50
		const centerY = 50
		const radius = 45
		const gapAngle = 2 // Gap in degrees

		const sliceAngle = 360 / attributeCount - gapAngle

		for (let i = 0; i < attributeCount; i++) {
			const startAngle = i * (sliceAngle + gapAngle)
			const endAngle = startAngle + sliceAngle

			// Convert angles to radians
			const startRad = ((startAngle - 90) * Math.PI) / 180
			const endRad = ((endAngle - 90) * Math.PI) / 180

			// Calculate coordinates
			const x1 = centerX + radius * Math.cos(startRad)
			const y1 = centerY + radius * Math.sin(startRad)
			const x2 = centerX + radius * Math.cos(endRad)
			const y2 = centerY + radius * Math.sin(endRad)

			// Create path for the slice
			const largeArcFlag = sliceAngle > 180 ? 1 : 0

			const pathData = `
				M ${centerX} ${centerY}
				L ${x1} ${y1}
				A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
				Z
			`

			slices.push(
				<path key={i} d={pathData} fill={sliceColors[i]} stroke="#ffffff" strokeWidth="1" />,
			)
		}

		return slices
	}

	// Handle click on the pie chart
	const handlePieClick = () => {
		if (isSupported) {
			setModalOpen(true)
		}
	}

	// Create the pizza slice visualization with the correct number of slices
	return (
		<>
			<div className={`flex flex-col items-center ${!isSupported ? 'opacity-40' : ''}`}>
				<div
					className={`w-10 h-10 rounded-full bg-white overflow-hidden relative ${isSupported ? 'cursor-pointer hover:shadow-md' : 'cursor-help'}`}
					title={tooltipText}
					onClick={handlePieClick}
				>
					<svg viewBox="0 0 100 100" className="w-full h-full">
						{createSlices()}
					</svg>
				</div>
				<div className="mt-1 text-xs font-medium">{attrGroup.displayName}</div>
			</div>

			{/* Rating Detail Modal */}
			{isSupported && (
				<RatingDetailModal
					open={modalOpen}
					onClose={() => {
						setModalOpen(false)
					}}
					attrGroup={attrGroup}
					evalTree={evalTree}
					attributeRatings={attributeRatings}
				/>
			)}
		</>
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
	const { standards } = getWalletTypeInfo(wallet as WalletLike)

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
				websiteUrl: wallet.metadata.url || 'Not available',
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

export default function WalletTable(): React.ReactElement {
	// Add state for selected device variant
	const [selectedVariant, setSelectedVariant] = useState<DeviceVariant>(DeviceVariant.NONE)
	const [data] = React.useState(() => [...defaultData])

	// Handler for device variant change
	const handleVariantChange = (variant: DeviceVariant) => {
		setSelectedVariant(variant === selectedVariant ? DeviceVariant.NONE : variant)
	}

	// Define columns inside the component to access the selectedVariant state
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
		// Add Device Support column
		{
			header: 'Device Support',
			accessorFn: (row: any) => {
				if (row.id.endsWith('-detail')) {
					return null
				}
				return 'device-support'
			},
			cell: (info: any) => {
				if (!info.getValue()) {
					return null
				}

				const wallet = info.row.original.wallet
				const supportsWeb = Boolean(wallet.variants?.browser)
				const supportsMobile = Boolean(wallet.variants?.mobile)
				const supportsDesktop = Boolean(wallet.variants?.desktop)
				const hasVariants = supportsWeb || supportsMobile || supportsDesktop

				return (
					<div className="flex space-x-3 items-center" style={{ width: '180px' }}>
						{/* Remove the reset/overall button */}
						{supportsWeb && (
							<button
								className={`p-1 rounded-md ${selectedVariant === DeviceVariant.WEB ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
								onClick={() => handleVariantChange(DeviceVariant.WEB)}
								title="Web/Browser"
							>
								<span className="text-xl">🌐</span>
							</button>
						)}
						{supportsMobile && (
							<button
								className={`p-1 rounded-md ${selectedVariant === DeviceVariant.MOBILE ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
								onClick={() => handleVariantChange(DeviceVariant.MOBILE)}
								title="Mobile"
							>
								<span className="text-xl">📱</span>
							</button>
						)}
						{supportsDesktop && (
							<button
								className={`p-1 rounded-md ${selectedVariant === DeviceVariant.DESKTOP ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
								onClick={() => handleVariantChange(DeviceVariant.DESKTOP)}
								title="Desktop"
							>
								<span className="text-xl">💻</span>
							</button>
						)}
						{!hasVariants && <span className="text-gray-400 text-sm">No device variants</span>}
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
				return categories.map(cat => WALLET_TYPE_DISPLAY[cat] || cat).join(' & ')
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

				const wallet = info.row.original.wallet
				const isSupported =
					selectedVariant === DeviceVariant.NONE || walletSupportsVariant(wallet, selectedVariant)
				const evalTree = getEvaluationTree(wallet, selectedVariant)

				return (
					<PizzaSliceChart
						attrGroup={securityAttributeGroup}
						evalTree={evalTree}
						isSupported={isSupported}
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

				const wallet = info.row.original.wallet
				const isSupported =
					selectedVariant === DeviceVariant.NONE || walletSupportsVariant(wallet, selectedVariant)
				const evalTree = getEvaluationTree(wallet, selectedVariant)

				return (
					<PizzaSliceChart
						attrGroup={privacyAttributeGroup}
						evalTree={evalTree}
						isSupported={isSupported}
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

				const wallet = info.row.original.wallet
				const isSupported =
					selectedVariant === DeviceVariant.NONE || walletSupportsVariant(wallet, selectedVariant)
				const evalTree = getEvaluationTree(wallet, selectedVariant)

				return (
					<PizzaSliceChart
						attrGroup={selfSovereigntyAttributeGroup}
						evalTree={evalTree}
						isSupported={isSupported}
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

				const wallet = info.row.original.wallet
				const isSupported =
					selectedVariant === DeviceVariant.NONE || walletSupportsVariant(wallet, selectedVariant)
				const evalTree = getEvaluationTree(wallet, selectedVariant)

				return (
					<PizzaSliceChart
						attrGroup={transparencyAttributeGroup}
						evalTree={evalTree}
						isSupported={isSupported}
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

				const wallet = info.row.original.wallet
				const isSupported =
					selectedVariant === DeviceVariant.NONE || walletSupportsVariant(wallet, selectedVariant)
				const evalTree = getEvaluationTree(wallet, selectedVariant)

				return (
					<PizzaSliceChart
						attrGroup={ecosystemAttributeGroup}
						evalTree={evalTree}
						isSupported={isSupported}
					/>
				)
			},
		},
	]

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
					{table
						.getRowModel()
						.rows.map(row => {
							// Skip rendering detail rows for unsupported wallets
							const isDetailRow = row.original.id.endsWith('-detail')
							const parentWallet = isDetailRow
								? data.find(w => w.id === row.original.id.replace('-detail', ''))?.wallet
								: row.original.wallet

							const isSupported =
								!parentWallet ||
								selectedVariant === DeviceVariant.NONE ||
								walletSupportsVariant(parentWallet, selectedVariant)

							// Skip detail rows for unsupported wallets
							if (isDetailRow && !isSupported) {
								return null
							}

							return (
								<tr
									key={row.id}
									className={`${row.original.id.endsWith('-detail') ? 'bg-gray-50' : ''} ${!isSupported ? 'opacity-50' : ''}`}
								>
									{row.getVisibleCells().map(cell => (
										<td
											key={cell.id}
											className="px-4 py-2"
											colSpan={
												row.original.id.endsWith('-detail') && cell.column.id === '0' ? 2 : 1
											}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							)
						})
						.filter(Boolean)}
				</tbody>
			</table>
		</div>
	)
}
