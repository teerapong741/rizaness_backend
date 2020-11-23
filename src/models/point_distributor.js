import mongoose from 'mongoose';

const pointDistributorSchema = mongoose.Schema({
	addPoint: {
		type: Number,
		required: true
    },
    delPoint: {
		type: Number,
		required: true
	},
	distributor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	description: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const PointDistributor = mongoose.model('PointDistributor', pointDistributorSchema);
export default PointDistributor;
