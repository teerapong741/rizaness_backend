import mongoose from 'mongoose'

const rewardStaffSchema = mongoose.Schema({
    rewardPoint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RewardPointStaffModel'
	},
	rewardRank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankStaffModel'
    },
    addPoint: {
        type: Number,
        required: true
    },
    delPoint: {
        type: Number,
        required: true
    },
    staff: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const RewardStaff = mongoose.model('RewardStaff', rewardStaffSchema);
export default RewardStaff;