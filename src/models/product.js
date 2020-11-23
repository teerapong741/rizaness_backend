import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	type: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ProductType'
		}
	],
	description: {
		type: String
	},
	imageUrl: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ImageUrl'
		}
	],
	price: {
		type: Number,
		required: true
	},
	min_of_stock: {
		type: Number,
		required: true
	},
	num_of_stock: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Stock'
		}
	],
	discountType: {
		type: String,
		default: 'none'
	},
	discount: {
		type: Number,
		default: 0
	},
	discountTimeStart: {
		type: Date
	},
	discountTimeEnd: {
		type: Date
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
	status_show: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'StatusShow',
			required: true
		}
	],
	status_product: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'StatusProduct',
			required: true
		}
	],
	mem_point: {
		type: Number,
		default: 0
	},
	dis_point: {
		type: Number,
		default: 0
	},
	productWholeSale: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ProductWholeSale',
			required: true
		}
	],
	SKU: {
		type: String
	},
	ParentSKU: {
		type: String,
		required: true
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	shops: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shop'
		}
	],
	pickUpFrom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
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
