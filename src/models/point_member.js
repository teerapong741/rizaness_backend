import mongoose from 'mongoose';

const pointMemberSchema = mongoose.Schema({
	addPoint: {
		type: Number,
		required: true
    },
    delPoint: {
		type: Number,
		required: true
	},
	memberCustomer: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	description: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const PointMember = mongoose.model('PointMember', pointMemberSchema);
export default PointMember;
