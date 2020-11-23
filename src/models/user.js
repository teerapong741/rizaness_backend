import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
	imageUrl: {
		type: String
	},
	username: {
		type: String,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	fname: {
		type: String,
		required: true
	},
	lname: {
		type: String,
		required: true
	},
	birthday: {
		type: Date,
		required: true
	},
	sex: {
		type: String,
		required: true,
		default: 'men'
	},
	email: {
		type: String,
		required: true
	},
	phone: {
		type: String
	},
	address: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Address'
		}
	],
	carts: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'CartItem'
		}
	],
	authority: {
		type: String,
		required: true
	},
	// mem_point: [
	// 	{
	// 		type: mongoose.Schema.Types.ObjectId,
	// 		ref: 'Product'
	// 	}
	// ],
	// dis_point: [
	// 	{
	// 		type: mongoose.Schema.Types.ObjectId,
	// 		ref: 'Product'
	// 	}
	// ],,
	shops: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shop'
		}
	],
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const User = mongoose.model('User', userSchema);
export default User;

// ,
// 	products: [
// 		{
// 			type: mongoose.Schema.Types.ObjectId,
// 			ref: 'Product'
// 		}
// 	]
