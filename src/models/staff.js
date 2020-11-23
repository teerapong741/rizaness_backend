import mongoose from 'mongoose';

const staffSchema = mongoose.Schema({
	rank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RankStaffModel',
      required: true
  },
  wages: {
      type: Number,
      required: true
  },
  employmentPattern: {
      type: String,
      required: true
  },
  workSchedules: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkSchedule'
        }
    ],
  discount: {
      type: Number,
      required: true
  },
  codeStaff: {
      type: String,
      required: true
  },
  data: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true   
  },
  // shop: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Shop',
  //     required: true   
  // },
  point: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PointStaff'
      }
  ],
  reward: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RewardStaff'
      }
  ],
  branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true
  },
  createdAt: {
      type: Date,
      required: true,
      default: () => Date.now()
  }
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
