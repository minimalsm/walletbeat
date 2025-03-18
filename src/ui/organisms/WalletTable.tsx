import React from 'react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	getExpandedRowModel,
} from '@tanstack/react-table'

const defaultData = [
	{
		id: 1,
		name: 'John Doe',
		age: 28,
		occupation: 'Developer',
		subRows: [
			{ id: 11, name: 'John Doe Jr.', age: 5, occupation: 'Kid' },
			{ id: 12, name: 'Jane Doe', age: 3, occupation: 'Kid' },
		],
	},
	{
		id: 2,
		name: 'Jane Smith',
		age: 34,
		occupation: 'Designer',
		subRows: [{ id: 21, name: 'Jimmy Smith', age: 7, occupation: 'Kid' }],
	},
	{ id: 3, name: 'Alice Johnson', age: 25, occupation: 'Project Manager' },
	{ id: 4, name: 'Bob Brown', age: 45, occupation: 'QA Engineer' },
	{ id: 5, name: 'Michael Green', age: 31, occupation: 'Product Owner' },
	{ id: 6, name: 'Sara Blue', age: 29, occupation: 'Developer' },
	{ id: 7, name: 'Emma White', age: 26, occupation: 'Data Analyst' },
	{ id: 8, name: 'Tom Black', age: 39, occupation: 'Support Engineer' },
	{ id: 9, name: 'Lucy Red', age: 32, occupation: 'UX Researcher' },
	{ id: 10, name: 'Mark Yellow', age: 40, occupation: 'CTO' },
]

const columns = [
	{
		header: 'Name',
		accessorKey: 'name',
		cell: ({ row, getValue }) => (
			<div style={{ paddingLeft: row.depth * 20 }}>
				{row.getCanExpand() ? (
					<button onClick={row.getToggleExpandedHandler()}>
						{row.getIsExpanded() ? '▼' : '▶'}
					</button>
				) : (
					<span style={{ display: 'inline-block', width: 18 }} />
				)}{' '}
				{getValue()}
			</div>
		),
	},
	{ header: 'Age', accessorKey: 'age' },
	{ header: 'Occupation', accessorKey: 'occupation' },
]

export default function ExpandableTable() {
	const [data] = React.useState(() => [...defaultData])

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
