import mongoose from 'mongoose';

const addressSchema = mongoose.Schema({
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
	user: {
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

const Address = mongoose.model('Address', addressSchema);
export default Address;
