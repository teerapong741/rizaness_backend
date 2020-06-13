import User from '../models/user';
import Product from '../models/product';

const Query = {
	user: (parent, args, { userId }, info) => {
		// เช็คถ้าว่ามี userId หรือเปล่า
		if (!userId) throw new Error('Please log in.');

		return User.findById(userId)
			.populate({
				path: 'address',
				populate: { path: 'user' }
			})
			.populate({
				path: 'products',
				populate: {
					path: 'user',
					populate: { path: 'traffic' }
				},
				populate: {
					path: 'imageUrl'
				}
			})
			.populate({
				path: 'carts',
				populate: { path: 'user' }
			})
			.populate({
				path: 'carts',
				populate: { path: 'product' }
			});
	},
	users: (parent, args, context, info) =>
		User.find({})
			.populate({
				path: 'address',
				populate: { path: 'user' }
			})
			.populate({
				path: 'products',
				populate: {
					path: 'user',
					populate: { path: 'traffic' }
				},
				populate: {
					path: 'imageUrl'
				}
			})
			.populate({
				path: 'carts',
				populate: { path: 'user' }
			})
			.populate({
				path: 'carts',
				populate: { path: 'product' }
			}),
	product: (parent, args, context, info) =>
		Product.findById(args.id)
			.populate({
				path: 'traffic',
				populate: { path: 'product' }
			})
			.populate({
				path: 'user',
				populate: { path: 'address', path: 'product' }
			})
			.populate({
				path: 'imageUrl',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_show',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_product',
				populate: { path: 'product' }
			}),
	products: (parent, args, context, info) =>
		Product.find({})
			.populate({
				path: 'traffic',
				populate: { path: 'product' }
			})
			.populate({
				path: 'user',
				populate: { path: 'address' }
			})
			.populate({
				path: 'user',
				populate: { path: 'products' }
			})
			.populate({
				path: 'imageUrl',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_show',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_product',
				populate: { path: 'product' }
			})
			.sort({ createdAt: 'desc' })
};

export default Query;
