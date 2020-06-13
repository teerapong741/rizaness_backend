import mongoose from 'mongoose';

const trafficSchema = mongoose.Schema({
	product: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product',
		required: true
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const Traffic = mongoose.model('Traffic', trafficSchema);
export default Traffic;
