import mongoose from 'mongoose';

const rewardDistributorSchema = mongoose.Schema({
	rewardPoint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RewardPointDistributorModel'
	},
	rewardRank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankDistributorModel'
    },
    addPoint: {
		type: Number,
		required: true
    },
    delPoint: {
		type: Number,
		required: true
	},
	distributor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const RewardDistributor = mongoose.model('RewardDistributor', rewardDistributorSchema);
export default RewardDistributor;
