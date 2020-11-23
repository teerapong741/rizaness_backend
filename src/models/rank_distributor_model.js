import mongoose from 'mongoose';

const rankDistributorModelSchema = mongoose.Schema({
	icon: {
		type: String
	},
	no: {
		type: Number,
		required: true
	},
	rank_name: {
		type: String,
		required: true
    },
    reward: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RewardRankDisModel'
		}
	],
    discount: {
		type: Number,
		required: true
    },
    condition: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ConditionRankDisModel'
		}
	],
    treatment: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'TreatmentRankDisModel'
		}
	],
    color: {
		type: String,
		required: true
	}
});

const RankDistributorModel = mongoose.model('RankDistributorModel', rankDistributorModelSchema);
export default RankDistributorModel;
