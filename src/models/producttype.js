import mongoose from 'mongoose';

const productTypeSchema = mongoose.Schema({
	type: {
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

const ProductType = mongoose.model('ProductType', productTypeSchema);
export default ProductType;
