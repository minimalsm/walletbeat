import React, { useState } from 'react'
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'

// Icons
const CoinbaseLogo = () => (
	<div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-md">
		<div className="text-white font-bold text-xs">C</div>
	</div>
)

const MetaMaskLogo = () => (
	<div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-md">
		<div className="text-white font-bold text-xs">M</div>
	</div>
)

const PhantomLogo = () => (
	<div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-md">
		<div className="text-white font-bold text-xs">P</div>
	</div>
)

// Rating Indicator Component
const RatingIndicator = ({ rating }) => {
	const getColors = () => {
		switch (rating) {
			case 'good':
				return {
					red: 'bg-red-200',
					green: 'bg-green-500',
					yellow: 'bg-yellow-400',
					gray: 'bg-gray-200',
				}
			case 'medium':
				return {
					red: 'bg-red-400',
					green: 'bg-green-300',
					yellow: 'bg-yellow-400',
					gray: 'bg-gray-400',
				}
			case 'poor':
				return {
					red: 'bg-red-500',
					green: 'bg-green-200',
					yellow: 'bg-yellow-200',
					gray: 'bg-gray-500',
				}
			default:
				return {
					red: 'bg-gray-300',
					green: 'bg-gray-300',
					yellow: 'bg-gray-300',
					gray: 'bg-gray-300',
				}
		}
	}

	const colors = getColors()

	return (
		<div className="flex items-center justify-center">
			<div className="w-10 h-10 rounded-full overflow-hidden relative">
				<div
					className="absolute w-1/2 h-1/2 top-0 left-0 rounded-tl-full rounded-br-none rounded-tr-none rounded-bl-none"
					style={{ backgroundColor: '#e74c3c' }}
				></div>
				<div
					className="absolute w-1/2 h-1/2 top-0 right-0 rounded-tr-full rounded-bl-none rounded-tl-none rounded-br-none"
					style={{ backgroundColor: '#2ecc71' }}
				></div>
				<div
					className="absolute w-1/2 h-1/2 bottom-0 right-0 rounded-br-full rounded-tl-none rounded-tr-none rounded-bl-none"
					style={{ backgroundColor: '#f1c40f' }}
				></div>
				<div
					className="absolute w-1/2 h-1/2 bottom-0 left-0 rounded-bl-full rounded-tr-none rounded-tl-none rounded-br-none"
					style={{ backgroundColor: '#bdc3c7' }}
				></div>
			</div>
		</div>
	)
}

// Device Indicator Component
const DeviceIndicator = ({ web = false, mobile = false, desktop = false }) => {
	return (
		<div className="flex flex-col items-center">
			<div className="flex justify-center space-x-2">
				{web && (
					<div className="flex flex-col items-center">
						<div className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300">
							<span className="text-lg">🌐</span>
						</div>
						<div
							className={`w-2 h-2 rounded-full mt-1 ${web ? 'bg-green-500' : 'bg-gray-300'}`}
						></div>
					</div>
				)}
				{mobile && (
					<div className="flex flex-col items-center">
						<div className="w-4 h-6 rounded-md border border-gray-300"></div>
						<div
							className={`w-2 h-2 rounded-full mt-1 ${mobile ? 'bg-green-500' : 'bg-gray-300'}`}
						></div>
					</div>
				)}
				{desktop && (
					<div className="flex flex-col items-center">
						<div className="w-6 h-4 rounded-md border border-gray-300"></div>
						<div
							className={`w-2 h-2 rounded-full mt-1 ${desktop ? 'bg-green-500' : 'bg-gray-300'}`}
						></div>
					</div>
				)}
			</div>
		</div>
	)
}

// Badge Component
const Badge = ({ text, color = 'purple' }) => (
	<span className={`inline-block px-2 py-1 text-xs text-white rounded-md bg-${color}-500 mr-1`}>
		{text}
	</span>
)

// Data
const data = [
	{
		id: 1,
		name: 'Coinbase Wallet',
		logo: <CoinbaseLogo />,
		type: 'EOA + Gaurdians',
		badges: [
			{ id: 1, text: '#4337', color: 'purple' },
			{ id: 2, text: '#7702', color: 'purple' },
		],
		risk: { web: true, mobile: true, desktop: true },
		privacy: 'good',
		security: 'medium',
		transparency: 'good',
		sovereignty: 'good',
		ecosystem: 'good',
	},
	{
		id: 2,
		name: 'MetaMask',
		logo: <MetaMaskLogo />,
		type: 'EOA + Gaurdians',
		badges: [
			{ id: 1, text: '#4337', color: 'purple' },
			{ id: 2, text: '#7702', color: 'purple' },
		],
		risk: { web: true, mobile: true, desktop: true },
		privacy: 'good',
		security: 'medium',
		transparency: 'good',
		sovereignty: 'good',
		ecosystem: 'good',
	},
	{
		id: 3,
		name: 'Phantom',
		logo: <PhantomLogo />,
		type: 'EOA + Gaurdians',
		badges: [
			{ id: 1, text: '#4337', color: 'purple' },
			{ id: 2, text: '#7702', color: 'purple' },
		],
		risk: { web: true, mobile: true, desktop: true },
		privacy: 'good',
		security: 'medium',
		transparency: 'good',
		sovereignty: 'good',
		ecosystem: 'good',
	},
	{
		id: 4,
		name: 'Coinbase Wallet',
		logo: <CoinbaseLogo />,
		type: 'EOA + Gaurdians',
		badges: [
			{ id: 1, text: '#4337', color: 'purple' },
			{ id: 2, text: '#7702', color: 'purple' },
		],
		risk: { web: true, mobile: true, desktop: true },
		privacy: 'good',
		security: 'medium',
		transparency: 'good',
		sovereignty: 'good',
		ecosystem: 'good',
	},
	{
		id: 5,
		name: 'Coinbase Wallet',
		logo: <CoinbaseLogo />,
		type: 'EOA + Gaurdians',
		badges: [
			{ id: 1, text: '#4337', color: 'purple' },
			{ id: 2, text: '#7702', color: 'purple' },
		],
		risk: { web: true, mobile: true, desktop: true },
		privacy: 'good',
		security: 'medium',
		transparency: 'good',
		sovereignty: 'good',
		ecosystem: 'good',
	},
]

// Column Helper
const columnHelper = createColumnHelper()

// App Component
const WalletTable = () => {
	const [activeTab, setActiveTab] = useState('wallets')

	const columns = [
		columnHelper.accessor('#', {
			cell: info => info.row.index + 1,
			header: '#',
		}),
		columnHelper.accessor('logo', {
			cell: info => info.getValue(),
			header: '',
		}),
		columnHelper.accessor('name', {
			cell: info => <span className="font-bold">{info.getValue()}</span>,
			header: 'Name',
		}),
		columnHelper.accessor('type', {
			cell: info => (
				<div>
					<div>{info.getValue()}</div>
					<div className="mt-1">
						{info.row.original.badges.map(badge => (
							<Badge key={badge.id} text={badge.text} color={badge.color} />
						))}
					</div>
				</div>
			),
			header: 'Type',
		}),
		columnHelper.accessor('risk', {
			cell: info => (
				<DeviceIndicator
					web={info.getValue().web}
					mobile={info.getValue().mobile}
					desktop={info.getValue().desktop}
				/>
			),
			header: 'Risk by device',
		}),
		columnHelper.accessor('privacy', {
			cell: info => <RatingIndicator rating={info.getValue()} />,
			header: 'Privacy',
		}),
		columnHelper.accessor('security', {
			cell: info => <RatingIndicator rating={info.getValue()} />,
			header: 'Security',
		}),
		columnHelper.accessor('transparency', {
			cell: info => <RatingIndicator rating={info.getValue()} />,
			header: 'Transparency',
		}),
		columnHelper.accessor('sovereignty', {
			cell: info => <RatingIndicator rating={info.getValue()} />,
			header: 'Sovereignty',
		}),
		columnHelper.accessor('ecosystem', {
			cell: info => <RatingIndicator rating={info.getValue()} />,
			header: 'Ecosystem',
		}),
	]

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return (
		<div className="p-4">
			{/* Tabs */}
			<div className="flex mb-4">
				<button
					className={`px-4 py-2 rounded-lg mr-2 ${
						activeTab === 'wallets' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'
					}`}
					onClick={() => setActiveTab('wallets')}
				>
					wallets{' '}
					<span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-md">13</span>
				</button>
				<button
					className={`px-4 py-2 rounded-lg ${
						activeTab === 'hardware' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'
					}`}
					onClick={() => setActiveTab('hardware')}
				>
					hardware wallets{' '}
					<span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-md">13</span>
				</button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="min-w-full">
					<thead>
						{table.getHeaderGroups().map(headerGroup => (
							<tr key={headerGroup.id} className="border-b-2 border-gray-200">
								{headerGroup.headers.map(header => (
									<th key={header.id} className="px-4 py-3 text-left text-gray-600">
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
							<tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
								{row.getVisibleCells().map(cell => (
									<td key={cell.id} className="px-4 py-6">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default WalletTable
