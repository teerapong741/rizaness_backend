import mongoose from 'mongoose';

const treatmentRankDisModelSchema = mongoose.Schema({
    img: {
        type: String
    },
	treatment: {
		type: String,
		required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const TreatmentRankDisModel = mongoose.model('TreatmentRankDisModel', treatmentRankDisModelSchema);
export default TreatmentRankDisModel;
