import mongoose from 'mongoose';

const shopSchema = mongoose.Schema({
	profileShop: {
		type: String
	},
	shopName: {
		type: String,
		required: true
	},
	addressShop: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'AddressShop'
	},
	storeFront: {
		type: Boolean,
		required: true
	},
	dis_system: {
		type: Boolean,
		required: true
	},
	dis_stock: {
		type: Boolean,
		required: true
	},
	dis_no_stock: {
		type: Boolean,
		required: true
	},
	layer_depth: {
		type: Number
	},
	workforce_per_row: {
		type: Number
	},
	layer_depth_rewards: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'LayerDepthReward'
		}
	],
	rank_distributors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RankDistributorModel'
		}
	],
	rank_members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RankMemberModel'
		}
	],
	rank_staffs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RankStaffModel'
		}
    ],
    point_distributors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RewardPointDistributorModel'
		}
    ],
    point_members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RewardPointMemberModel'
		}
	],
	point_staffs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RewardPointStaffModel'
		}
	],
	owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
	},
    memberCustomers: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'MemberCustomer'
		}
    ],
    distributors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Distributor'
		}
	],
	staffs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Staff'
		}
    ],
    products: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product'
		}
	],
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const Shop = mongoose.model('Shop', shopSchema);
export default Shop;