import mongoose from 'mongoose';

const productWholeSaleSchema = mongoose.Schema({
	price: {
		type: Number,
		required: true
	},
	min_sale: {
		type: Number,
		required: true
	},
	max_sale: {
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

const ProductWholeSale = mongoose.model('ProductWholeSale', productWholeSaleSchema);
export default ProductWholeSale;
