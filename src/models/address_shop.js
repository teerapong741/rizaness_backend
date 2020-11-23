import mongoose from 'mongoose';

const addressShopSchema = mongoose.Schema({
	address: {
		type: String,
		required: true
	},
	sub_area: {
		type: String,
		required: true,
		trim: true
	},
	district: {
		type: String,
		required: true,
		trim: true
	},
	province: {
		type: String,
		required: true,
		trim: true
	},
	postal_code: {
		type: String,
		required: true,
		trim: true
	},
	shop: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Shop',
		required: true
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const AddressShop = mongoose.model('AddressShop', addressShopSchema);
export default AddressShop;
