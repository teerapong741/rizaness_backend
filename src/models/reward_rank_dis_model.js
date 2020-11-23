import mongoose from 'mongoose';

const rewardRankDisModelSchema = mongoose.Schema({
    img: {
        type: String
    },
	reward: {
		type: String,
		required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const RewardRankDisModel = mongoose.model('RewardRankDisModel', rewardRankDisModelSchema);
export default RewardRankDisModel;
