import mongoose from 'mongoose';

const statusProductSchema = mongoose.Schema({
	status: {
		type: String,
		required: true
	},
	product: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true
		}
	],
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const StatusProduct = mongoose.model('StatusProduct', statusProductSchema);
export default StatusProduct;
