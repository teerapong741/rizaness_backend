import mongoose from 'mongoose';

const conditionRankDisModelSchema = mongoose.Schema({
    img: {
        type: String
    },
	condition: {
		type: String,
		required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const ConditionRankDisModel = mongoose.model('ConditionRankDisModel', conditionRankDisModelSchema);
export default ConditionRankDisModel;
