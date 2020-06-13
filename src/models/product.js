import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	imageUrl: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ImageUrl',
			required: true
		}
	],
	price: {
		type: Number,
		required: true
	},
	discountType: {
		type: String,
		default: 'none'
	},
	discount: {
		type: Number,
		default: 0
	},
	num_of_sold: {
		type: Number,
		default: 0
	},
	num_put_basket_now: {
		type: Number,
		default: 0
	},
	num_put_basket: {
		type: Number,
		default: 0
	},
	traffic: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Traffic'
		}
	],
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	StatusShow: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'StatusShow',
			required: true
		}
	],
	StatusProduct: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'StatusProduct',
			required: true
		}
	],
	SKU: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const Product = mongoose.model('Product', productSchema);
export default Product;
