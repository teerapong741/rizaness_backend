import mongoose from 'mongoose';

const distributorSchema = mongoose.Schema({
    // layer_depth: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'LayerDepthReward',
	// 	required: true
    // },
	rank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankDistributorModel',
		required: true
    },
    discount: {
		type: Number,
		required: true
    },
    codeDistributor: {
		type: String,
		required: true
    },
    data: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
		required: true   
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
		required: true   
    },
    point: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PointDistributor'
        }
    ],
    reward: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RewardDistributor'
        }
    ],
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    distributors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Distributor'
        }
    ],
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const Distributor = mongoose.model('Distributor', distributorSchema);
export default Distributor;
