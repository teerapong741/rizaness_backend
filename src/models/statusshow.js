import mongoose from 'mongoose';

const statusShowSchema = mongoose.Schema({
	status: {
		type: String,
		required: true
	},
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

const StatusShow = mongoose.model('StatusShow', statusShowSchema);
export default StatusShow;
