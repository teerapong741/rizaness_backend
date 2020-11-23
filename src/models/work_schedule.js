import mongoose from 'mongoose';

const workSchedulSchema = mongoose.Schema({
	  rank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankStaffModel',
		required: true
    },
    checkIn: {
        type: Date,
        required: true,
        default: () => Date.now()
    },
    checkOut: {
        type: Date
    },
    wages: {
        type: Number,
        required: true
    },
    employmentPattern: {
        type: String,
        required: true
    },
    totalWagesToDay: {
        type: Number  
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
		    required: true   
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const WorkSchedule = mongoose.model('WorkSchedule', workSchedulSchema);
export default WorkSchedule;
