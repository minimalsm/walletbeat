/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, 
@typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions,
@typescript-eslint/no-unsafe-call -- Disabled for complex typing with attribute groups */
import React from 'react'
import { Box, Modal, Typography, Button, Paper, useMediaQuery, useTheme } from '@mui/material'
import { Rating, type AttributeGroup } from '@/schema/attributes'
import type { EvaluationTree } from '@/schema/attribute-groups'

interface RatingDetailModalProps {
	open: boolean
	onClose: () => void
	attrGroup: AttributeGroup<any>
	evalTree: EvaluationTree
	attributeRatings: Array<{ rating: Rating; id: string }>
}

// Helper function to get readable name for attribute IDs
function getAttributeName(attrId: string): string {
	// Convert camelCase to Title Case with spaces
	return attrId
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, str => str.toUpperCase())
		.trim()
}

// Helper function to get rating color
function getRatingColor(rating: Rating): string {
	switch (rating) {
		case Rating.PASS:
			return '#2ecc71' // Green
		case Rating.PARTIAL:
			return '#f1c40f' // Yellow
		case Rating.FAIL:
			return '#e74c3c' // Red
		case Rating.UNRATED:
		case Rating.EXEMPT:
			return '#bdc3c7' // Gray
	}
}

// Helper function to get human-readable rating text
function getRatingText(rating: Rating): string {
	switch (rating) {
		case Rating.PASS:
			return 'Pass'
		case Rating.PARTIAL:
			return 'Partial'
		case Rating.FAIL:
			return 'Fail'
		case Rating.UNRATED:
			return 'Unrated'
		case Rating.EXEMPT:
			return 'Exempt'
	}
}

export function RatingDetailModal({
	open,
	onClose,
	attrGroup,
	evalTree,
	attributeRatings,
}: RatingDetailModalProps): React.ReactElement {
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const [highlightedSlice, setHighlightedSlice] = React.useState<number | null>(null)

	// Calculate overall score
	let overallScore = 0
	try {
		// Get the category object based on attribute group ID
		const categoryKey = attrGroup.id as keyof EvaluationTree
		const categoryData = evalTree[categoryKey]

		// Calculate score if data is available
		if (categoryData && attrGroup.score) {
			const result = attrGroup.score(categoryData)
			if (result && typeof result === 'object' && 'score' in result) {
				overallScore = result.score
			}
		}
	} catch (e) {
		console.error(`Error calculating score for ${attrGroup.id}:`, e)
	}

	// Create SVG slices for the enlarged chart
	const createEnlargedSlices = (): React.ReactNode[] => {
		const slices = []
		const attributeCount = attributeRatings.length > 0 ? attributeRatings.length : 4
		const centerX = 150
		const centerY = 150
		const radius = 120
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

			const rating = attributeRatings[i]?.rating ?? Rating.UNRATED
			const sliceColor = getRatingColor(rating)

			// Add the slice
			slices.push(
				<path
					key={i}
					d={pathData}
					fill={sliceColor}
					stroke="#ffffff"
					strokeWidth="2"
					style={{
						opacity: highlightedSlice === null || highlightedSlice === i ? 1 : 0.4,
						transition: 'opacity 0.2s ease-in-out',
						cursor: 'pointer',
					}}
					onMouseEnter={() => {
						handleMouseEnter(i)
					}}
					onMouseLeave={handleMouseLeave}
				/>,
			)
		}

		return slices
	}

	// Handlers for hover events
	const handleMouseEnter = (index: number): void => {
		setHighlightedSlice(index)
	}

	const handleMouseLeave = (): void => {
		setHighlightedSlice(null)
	}

	return (
		<Modal open={open} onClose={onClose} aria-labelledby="rating-detail-modal-title">
			<Paper
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: isMobile ? '95%' : 700,
					maxWidth: '95vw',
					maxHeight: '90vh',
					overflow: 'auto',
					bgcolor: 'background.paper',
					boxShadow: 24,
					borderRadius: 2,
					p: 3,
				}}
			>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Typography variant="h5" component="h2" id="rating-detail-modal-title">
						{attrGroup.displayName} - {Math.round(overallScore * 100)}% Overall
					</Typography>
					<Button onClick={onClose} variant="outlined" size="small">
						Close
					</Button>
				</Box>

				<Box
					sx={{
						display: 'flex',
						flexDirection: isMobile ? 'column' : 'row',
						gap: 4,
						alignItems: isMobile ? 'center' : 'flex-start',
					}}
				>
					{/* Chart */}
					<Box sx={{ width: 280, height: 280, flexShrink: 0 }}>
						<svg viewBox="0 0 300 300" width="100%" height="100%">
							{createEnlargedSlices()}
						</svg>
					</Box>

					{/* Attribute details */}
					<Box sx={{ flex: 1, width: '100%' }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
							Attribute Details:
						</Typography>
						{attributeRatings.length > 0 ? (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
									maxHeight: isMobile ? '300px' : '350px',
									overflowY: 'auto',
									pr: 1,
								}}
							>
								{attributeRatings.map((attr, index) => (
									<Box
										key={attr.id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											p: 1,
											borderRadius: 1,
											backgroundColor:
												highlightedSlice === index ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
											transition: 'background-color 0.2s ease',
											cursor: 'pointer',
											fontSize: '0.9rem',
										}}
										onMouseEnter={() => {
											handleMouseEnter(index)
										}}
										onMouseLeave={handleMouseLeave}
									>
										<Box
											sx={{
												width: 12,
												height: 12,
												borderRadius: '50%',
												backgroundColor: getRatingColor(attr.rating),
												mr: 1.5,
												flexShrink: 0,
											}}
										/>
										<Typography
											variant="body2"
											sx={{
												flex: 1,
												fontSize: '0.9rem',
											}}
										>
											{getAttributeName(attr.id)}
										</Typography>
										<Box
											sx={{
												backgroundColor: getRatingColor(attr.rating),
												px: 1,
												py: 0.25,
												borderRadius: 1,
												color:
													attr.rating === Rating.FAIL || attr.rating === Rating.PASS
														? 'white'
														: 'black',
												fontWeight: 'bold',
												minWidth: 50,
												textAlign: 'center',
												flexShrink: 0,
												fontSize: '0.8rem',
											}}
										>
											{getRatingText(attr.rating)}
										</Box>
									</Box>
								))}
							</Box>
						) : (
							<Typography variant="body2" color="text.secondary">
								No attribute ratings available for this category.
							</Typography>
						)}
					</Box>
				</Box>
			</Paper>
		</Modal>
	)
}
