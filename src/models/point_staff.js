import mongoose from 'mongoose'

const pointStaffSchema = mongoose.Schema({
    addPoint: {
        type: Number,
        required: true
    },
    delPoint: {
        type: Number,
        required: true
    },
    staff: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Staff'
    },
    description: {
		type: String,
		required: true
	},
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const PointStaff = mongoose.model('PointStaff', pointStaffSchema);
export default PointStaff;