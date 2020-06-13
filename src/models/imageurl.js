import mongoose from 'mongoose';

const imageUrlSchema = mongoose.Schema({
	imageUrl: {
		type: String,
		required: true
	},
	product: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product',
		required: true
	},
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now()
	}
});

const ImageUrl = mongoose.model('ImageUrl', imageUrlSchema);
export default ImageUrl;
