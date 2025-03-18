import type { ReactElement } from 'react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Box, Tooltip } from '@mui/material'
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
import { securityAttributeGroup } from '@/schema/attribute-groups'
import type { AttributeGroup, ValueSet } from '@/schema/attributes'
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
		evalGroupFn: (tree: EvaluationTree) => Record<string, unknown>,
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
}> =>
	walletRows.map(row => ({
		id: row.id,
		// Store the row object in each row data for access in cell renderers
		row: row,
		displayName: row.wallet.metadata.displayName,
		walletType: row.wallet.metadata.walletType?.category ?? 'EOA',
		security: securityAttributeGroup.id,
	}))

export default function WalletTable(): ReactElement {
	// Set up table and row state
	const [tableState, setTableState] = useState<WalletTableState>({
		variantSelected: null,
	})
	const tableStateHandle = new TableStateHandle(tableState, setTableState)
	const [rowsState, setRowsState] = useState<Record<string, WalletRowState>>({})

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
						<Box>{info.getValue() as unknown as string}</Box>
					</Tooltip>
				)
			},
		},
		{
			accessorKey: 'security',
			header: 'Security',
			cell: info => info.row.original.row.render(securityAttributeGroup, tree => tree.security),
		},
	]

	// Create table
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
