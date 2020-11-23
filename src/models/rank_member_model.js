import mongoose from 'mongoose';

const rankMemberModelSchema = mongoose.Schema({
	no: {
		type: Number,
		required: true
	},
	rank_name: {
		type: String,
		required: true
    },
    reward: {
		type: String,
		required: true
    },
    discount: {
		type: Number,
		required: true
    },
    condition: {
		type: String,
		required: true
    },
    treatment: {
		type: String,
		required: true
	}
});

const RankMemberModel = mongoose.model('RankMemberModel', rankMemberModelSchema);
export default RankMemberModel;
