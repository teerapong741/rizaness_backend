import mongoose from 'mongoose';

const rewardPointMemberModelSchema = mongoose.Schema({
	condition: {
		type: String,
		required: true
    },
    usePoint: {
		type: Number,
		required: true
    },
    reward: {
		type: String,
		required: true
    }
});

const RewardPointMemberModel = mongoose.model('RewardPointMemberModel', rewardPointMemberModelSchema);
export default RewardPointMemberModel;
