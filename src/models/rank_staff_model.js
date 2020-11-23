import mongoose from 'mongoose'

const rankStaffModelSchema = mongoose.Schema({
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

const RankStaffModel = mongoose.model('RankStaffModel', rankStaffModelSchema);
export default RankStaffModel;