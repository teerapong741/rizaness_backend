import mongoose from 'mongoose';

const stockEditSchema = mongoose.Schema({
	stockEdit: {
		type: Number,
		required: true
	},
	priceEdit: {
		type: Number,
		required: true
	},
	costEdit: {
		type: Number,
		required: true
	},
	statusExpirationEdit: {
		type: String,
		required: true
	},
	ExpirationEdit: {
		type: Date
	},
	stock: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Stock',
		required: true
	},
	createdAt: {
		type: Date,
		required: true
	}
});

const StockEdit = mongoose.model('StockEdit', stockEditSchema);
export default StockEdit;
