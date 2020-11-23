import mongoose from 'mongoose';

const layerDepthRewardSchema = mongoose.Schema({
	layer: {
		type: Number,
		required: true
	},
	type: {
        type: String,
        required: true
	},
	discount: {
		type: Number,
		required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const LayerDepthReward = mongoose.model('LayerDepthReward', layerDepthRewardSchema);
export default LayerDepthReward;