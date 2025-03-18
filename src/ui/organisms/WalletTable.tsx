import type { ReactElement } from 'react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Box, Tooltip, useTheme, Paper, Typography } from '@mui/material'
import { useState } from 'react'

// Replace with your actual data source
import { ratedWallets } from '@/data/wallets'
import { WalletNameCell } from '@/ui/molecules/WalletNameCell'
import { WalletRatingCell } from '@/ui/molecules/WalletRatingCell'
import type {
	WalletRowState,
	WalletRowStateHandle,
	WalletTableState,
	WalletTableStateHandle,
} from '@/ui/WalletTableState'
import type { Variant } from '@/schema/variants'
import type { EvaluationTree } from '@/schema/attribute-groups'
import type { SxProps } from '@mui/material'
import {
	securityAttributeGroup,
	privacyAttributeGroup,
	selfSovereigntyAttributeGroup,
	transparencyAttributeGroup,
	ecosystemAttributeGroup,
} from '@/schema/attribute-groups'
import type { AttributeGroup, ValueSet, EvaluatedGroup } from '@/schema/attributes'
import type { RatedWallet } from '@/schema/wallet'

// Create TableStateHandle class for variant selection management
class TableStateHandle implements WalletTableStateHandle {
	readonly variantSelected: Variant | null

	private readonly setTableState: React.Dispatch<React.SetStateAction<WalletTableState>>

	constructor(
		tableState: WalletTableState,
		setTableState: React.Dispatch<React.SetStateAction<WalletTableState>>,
	) {
		this.variantSelected = tableState.variantSelected
		this.setTableState = setTableState
	}

	variantClick(clicked: Variant): void {
		this.setTableState(prevState => ({
			variantSelected: clicked === prevState.variantSelected ? null : clicked,
		}))
	}
}

// Create WalletRow class implementing WalletRowStateHandle
class WalletRow implements WalletRowStateHandle {
	readonly wallet: RatedWallet
	readonly evalTree: EvaluationTree
	readonly table: WalletTableStateHandle
	readonly expanded: boolean
	readonly rowWideStyle: SxProps
	readonly id: string

	private readonly setRowsState: React.Dispatch<
		React.SetStateAction<Record<string, WalletRowState>>
	>

	constructor(
		wallet: RatedWallet,
		tableStateHandle: WalletTableStateHandle,
		rowsState: Record<string, WalletRowState>,
		setRowsState: React.Dispatch<React.SetStateAction<Record<string, WalletRowState>>>,
	) {
		this.wallet = wallet
		this.id = wallet.metadata.id
		this.table = tableStateHandle
		const rowState = rowsState[this.id] ?? { expanded: false }
		this.expanded = rowState.expanded
		this.setRowsState = setRowsState
		this.rowWideStyle = {
			color: 'var(--text-primary)',
		}
		this.evalTree = wallet.overall
		if (tableStateHandle.variantSelected !== null) {
			const walletForVariant = wallet.variants[tableStateHandle.variantSelected]
			if (walletForVariant === undefined) {
				this.rowWideStyle = {
					filter: 'contrast(65%)',
					opacity: 0.5,
					color: 'var(--text-primary)',
				}
			} else {
				this.evalTree = walletForVariant.attributes
			}
		}
	}

	toggleExpanded(): void {
		this.setRowsState((prevState: Record<string, WalletRowState>) => ({
			...prevState,
			[this.id]: {
				expanded: !this.expanded,
			},
		}))
	}

	setExpanded(expanded: boolean): void {
		this.setRowsState((prevState: Record<string, WalletRowState>) => ({
			...prevState,
			[this.id]: {
				expanded,
			},
		}))
	}

	render<Vs extends ValueSet>(
		attrGroup: AttributeGroup<Vs>,
		evalGroupFn: (tree: EvaluationTree) => EvaluatedGroup<Vs>,
	): React.JSX.Element {
		return <WalletRatingCell<Vs> row={this} attrGroup={attrGroup} evalGroupFn={evalGroupFn} />
	}
}

// Prepare table data format for tanstack table
const prepareTableData = (
	walletRows: WalletRow[],
): Array<{
	id: string
	row: WalletRow
	displayName: string
	walletType: string
	security: string
	privacy: string
	selfSovereignty: string
	transparency: string
	ecosystem: string
}> =>
	walletRows.map(row => ({
		id: row.id,
		// Store the row object in each row data for access in cell renderers
		row: row,
		displayName: row.wallet.metadata.displayName,
		walletType: row.wallet.metadata.walletType?.category ?? 'EOA',
		security: securityAttributeGroup.id,
		privacy: privacyAttributeGroup.id,
		selfSovereignty: selfSovereigntyAttributeGroup.id,
		transparency: transparencyAttributeGroup.id,
		ecosystem: ecosystemAttributeGroup.id,
	}))

export default function WalletTable(): ReactElement {
	// Set up table and row state
	const [tableState, setTableState] = useState<WalletTableState>({
		variantSelected: null,
	})
	const tableStateHandle = new TableStateHandle(tableState, setTableState)
	const [rowsState, setRowsState] = useState<Record<string, WalletRowState>>({})
	const theme = useTheme()

	// Create wallet rows with proper state handling
	const walletRows = Object.values(ratedWallets).map(
		wallet => new WalletRow(wallet, tableStateHandle, rowsState, setRowsState),
	)

	// Prepare data for tanstack table
	const data = prepareTableData(walletRows)

	// Define columns for the table
	const columns: Array<ColumnDef<(typeof data)[number]>> = [
		{
			accessorKey: 'displayName',
			header: 'Wallet',
			cell: info => <WalletNameCell row={info.row.original.row} />,
		},
		{
			accessorKey: 'walletType',
			header: 'Type',
			cell: info => {
				const row = info.row.original.row
				const wallet = row.wallet
				const detailedText =
					wallet.metadata.walletType?.details ?? wallet.metadata.walletType?.category ?? 'EOA'
				return (
					<Tooltip title={detailedText} arrow placement="top">
						<Box>{info.getValue() as string}</Box>
					</Tooltip>
				)
			},
		},
		{
			accessorKey: 'security',
			header: 'Security',
			cell: info => info.row.original.row.render(securityAttributeGroup, tree => tree.security),
		},
		{
			accessorKey: 'privacy',
			header: 'Privacy',
			cell: info => info.row.original.row.render(privacyAttributeGroup, tree => tree.privacy),
		},
		{
			accessorKey: 'selfSovereignty',
			header: 'Self Sovereignty',
			cell: info =>
				info.row.original.row.render(selfSovereigntyAttributeGroup, tree => tree.selfSovereignty),
		},
		{
			accessorKey: 'transparency',
			header: 'Transparency',
			cell: info =>
				info.row.original.row.render(transparencyAttributeGroup, tree => tree.transparency),
		},
		{
			accessorKey: 'ecosystem',
			header: 'Ecosystem',
			cell: info => info.row.original.row.render(ecosystemAttributeGroup, tree => tree.ecosystem),
		},
	]

	// Create table
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<Box sx={{ width: '100%', height: '100%', overflowX: 'auto', px: 2 }}>
			<Typography
				variant="h2"
				sx={{
					fontSize: '1.5rem',
					fontWeight: 'bold',
					mb: 2,
					pb: 1,
					borderBottom: '1px solid var(--border, #e0e0e0)',
					color: 'var(--text-accent, #1976d2)',
				}}
			>
				Wallets
			</Typography>

			<Paper
				elevation={theme.palette.mode === 'dark' ? 3 : 1}
				sx={{
					width: '100%',
					maxWidth: '1600px',
					margin: '0 auto',
					overflow: 'auto',
					borderRadius: 1,
					mb: 6,
					bgcolor: 'var(--background-primary, #fff)',
				}}
			>
				<Box
					sx={{
						overflow: 'auto',
						'&::-webkit-scrollbar': {
							height: '8px',
						},
						'&::-webkit-scrollbar-thumb': {
							backgroundColor: 'rgba(0, 0, 0, 0.2)',
							borderRadius: '4px',
						},
					}}
				>
					<table
						style={{
							width: '100%',
							minWidth: '1200px',
							borderCollapse: 'separate',
							borderSpacing: 0,
							border: 'none',
						}}
					>
						<thead>
							{table.getHeaderGroups().map(headerGroup => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header, index) => (
										<Box
											component="th"
											key={header.id}
											sx={{
												bgcolor: 'var(--background-row-border, #f5f5f5)',
												color: 'var(--text-primary, #333)',
												fontSize: '1.05rem',
												fontWeight: 'bold',
												textAlign: 'left',
												height: '64px',
												padding: '8px 16px',
												borderBottom: '2px solid var(--border, #e0e0e0)',
												position: 'sticky',
												top: 0,
												zIndex: 2,
												...(index === 0 && {
													position: 'sticky',
													left: 0,
													zIndex: 3,
													minWidth: '310px',
													width: '310px',
													borderRight: '1px solid var(--border, #e0e0e0)',
												}),
												...(index === 1 && {
													minWidth: '142px',
													width: '142px',
												}),
											}}
										>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'flex-start',
													height: '100%',
												}}
											>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
											</Box>
										</Box>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row, rowIdx) => {
								const rowData = row.original.row
								const isExpanded = rowData.expanded
								const rowHeight = isExpanded ? '220px' : '140px'
								const customSx = rowData.rowWideStyle

								return (
									<Box
										component="tr"
										key={row.id}
										sx={{
											height: rowHeight,
											bgcolor:
												rowIdx % 2 === 1
													? 'var(--background-secondary, #fafafa)'
													: 'var(--background-primary, #fff)',
											'&:hover': {
												bgcolor: 'rgba(25, 118, 210, 0.04)',
											},
											transition: 'background-color 0.2s',
											...customSx,
										}}
									>
										{row.getVisibleCells().map((cell, index) => (
											<Box
												component="td"
												key={cell.id}
												sx={{
													padding: '16px',
													borderBottom: '1px solid var(--border, #e0e0e0)',
													color: 'var(--text-primary, #333)',
													fontSize: '1rem',
													lineHeight: 1.4,
													verticalAlign: 'middle',
													...(index === 0 && {
														position: 'sticky',
														left: 0,
														zIndex: 1,
														bgcolor:
															rowIdx % 2 === 1
																? 'var(--background-secondary, #fafafa)'
																: 'var(--background-primary, #fff)',
														'tr:hover &': {
															bgcolor: 'rgba(25, 118, 210, 0.04)',
														},
														borderRight: '1px solid var(--border, #e0e0e0)',
														minWidth: '310px',
														width: '310px',
													}),
													...(index === 1 && {
														minWidth: '142px',
														width: '142px',
													}),
												}}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</Box>
										))}
									</Box>
								)
							})}
						</tbody>
					</table>
				</Box>
			</Paper>
		</Box>
	)
}
