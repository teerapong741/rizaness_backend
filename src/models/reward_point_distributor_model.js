import mongoose from 'mongoose';

const rewardPointDistributorModelSchema = mongoose.Schema({
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

const RewardPointDistributorModel = mongoose.model('RewardPointDistributorModel', rewardPointDistributorModelSchema);
export default RewardPointDistributorModel;
