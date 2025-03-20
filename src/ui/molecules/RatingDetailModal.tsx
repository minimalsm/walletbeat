import type React from 'react'
import { Box, Modal, Typography, Button, Paper } from '@mui/material'
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
		default:
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
		default:
			return 'Unknown'
	}
}

export function RatingDetailModal({
	open,
	onClose,
	attrGroup,
	evalTree,
	attributeRatings,
}: RatingDetailModalProps): React.ReactElement {
	// Calculate overall score
	let overallScore = 0
	try {
		// Get the category object based on attribute group ID
		const categoryData = evalTree[attrGroup.id as keyof EvaluationTree]
		if (categoryData) {
			const score = attrGroup.score(categoryData as any)
			overallScore = score?.score ?? 0
		}
	} catch (e) {
		console.error(`Error calculating score for ${attrGroup.id}:`, e)
	}

	// Create SVG slices for the enlarged chart
	const createEnlargedSlices = () => {
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

			// Calculate coordinates for label placement
			const labelRad = ((startAngle + sliceAngle / 2 - 90) * Math.PI) / 180
			const labelRadius = radius * 1.3 // Place labels slightly outside the pie
			const labelX = centerX + labelRadius * Math.cos(labelRad)
			const labelY = centerY + labelRadius * Math.sin(labelRad)

			// Create path for the slice
			const largeArcFlag = sliceAngle > 180 ? 1 : 0

			const pathData = `
                M ${centerX} ${centerY}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
            `

			const rating = attributeRatings[i]?.rating ?? 'UNRATED'
			const sliceColor = getRatingColor(rating)

			// Add the slice and its label
			slices.push(
				<g key={i}>
					<path d={pathData} fill={sliceColor} stroke="#ffffff" strokeWidth="2" />
					{attributeRatings[i] && (
						<foreignObject
							x={labelX - 75}
							y={labelY - 20}
							width={150}
							height={40}
							style={{
								overflow: 'visible',
								textAlign: startAngle > 90 && startAngle < 270 ? 'right' : 'left',
							}}
						>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: startAngle > 90 && startAngle < 270 ? 'flex-end' : 'flex-start',
								}}
							>
								<span
									style={{
										fontWeight: 'bold',
										fontSize: '14px',
										whiteSpace: 'nowrap',
									}}
								>
									{getAttributeName(attributeRatings[i].id)}
								</span>
								<span
									style={{
										backgroundColor: sliceColor,
										padding: '2px 6px',
										borderRadius: '4px',
										color: rating === 'FAIL' || rating === 'PASS' ? 'white' : 'black',
										fontSize: '12px',
										fontWeight: 'bold',
										marginTop: '2px',
									}}
								>
									{getRatingText(rating)}
								</span>
							</div>
						</foreignObject>
					)}
				</g>,
			)
		}

		return slices
	}

	return (
		<Modal open={open} onClose={onClose} aria-labelledby="rating-detail-modal-title">
			<Paper
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: 600,
					maxWidth: '90vw',
					maxHeight: '90vh',
					overflow: 'auto',
					bgcolor: 'background.paper',
					boxShadow: 24,
					borderRadius: 2,
					p: 4,
				}}
			>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<Typography variant="h5" component="h2" id="rating-detail-modal-title">
						{attrGroup.displayName} - {Math.round(overallScore * 100)}% Overall
					</Typography>
					<Button onClick={onClose} variant="outlined" size="small">
						Close
					</Button>
				</Box>

				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
					<Box sx={{ position: 'relative', width: 300, height: 300 }}>
						<svg viewBox="0 0 300 300" width="100%" height="100%">
							{createEnlargedSlices()}
						</svg>
					</Box>
				</Box>

				<Box sx={{ mt: 3 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
						Attribute Details:
					</Typography>
					{attributeRatings.length > 0 ? (
						attributeRatings.map(attr => (
							<Box
								key={attr.id}
								sx={{
									display: 'flex',
									alignItems: 'center',
									mb: 1,
									p: 1,
									borderRadius: 1,
									backgroundColor: 'rgba(0,0,0,0.05)',
								}}
							>
								<Box
									sx={{
										width: 16,
										height: 16,
										borderRadius: '50%',
										backgroundColor: getRatingColor(attr.rating),
										mr: 2,
									}}
								/>
								<Typography variant="body1" sx={{ flex: 1 }}>
									{getAttributeName(attr.id)}
								</Typography>
								<Box
									sx={{
										backgroundColor: getRatingColor(attr.rating),
										px: 1.5,
										py: 0.5,
										borderRadius: 1,
										color: attr.rating === 'FAIL' || attr.rating === 'PASS' ? 'white' : 'black',
										fontWeight: 'bold',
									}}
								>
									{getRatingText(attr.rating)}
								</Box>
							</Box>
						))
					) : (
						<Typography variant="body2" color="text.secondary">
							No attribute ratings available for this category.
						</Typography>
					)}
				</Box>
			</Paper>
		</Modal>
	)
}
