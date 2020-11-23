import mongoose from 'mongoose'

const rewardPointStaffModelSchema = mongoose.Schema({
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

const RewardPointStaffModel = mongoose.model('RewardPointStaffModel', rewardPointStaffModelSchema);
export default RewardPointStaffModel;