import mongoose from 'mongoose';

const stockSchema = mongoose.Schema({
	stock: {
		type: Number,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	cost: {
		type: Number,
		required: true
	},
	statusExpiration: {
		type: String,
		required: true
	},
	Expiration: {
		type: Date
	},
	stockEdit: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'StockEdit',
			required: true
		}
	],
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

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
