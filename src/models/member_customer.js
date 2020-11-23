import mongoose from 'mongoose';

const memberCustomerSchema = mongoose.Schema({
	rank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankMemberModel',
		required: true
    },
    discount: {
		type: Number,
		required: true
    },
    codeCustomer: {
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
            ref: 'PointMember'
        }
    ],
    reward: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RewardMember'
        }
    ],
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    }
});

const MemberCustomer = mongoose.model('MemberCustomer', memberCustomerSchema);
export default MemberCustomer;
