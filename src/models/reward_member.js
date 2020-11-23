import mongoose from 'mongoose';

const rewardMemberSchema = mongoose.Schema({
	rewardPoint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RewardPointMemberModel'
	},
	rewardRank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankMemberModel'
    },
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
		ref: 'User'
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const RewardMember = mongoose.model('RewardMember', rewardMemberSchema);
export default RewardMember;
