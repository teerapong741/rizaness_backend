import User from '../models/user';
import Product from '../models/product';
import ImageUrl from '../models/imageurl';
import StatusShow from '../models/statusshow';
import StatusProduct from '../models/statusproduct';
import Address from '../models/address'
import Shop from '../models/shop'
import AddressShop from '../models/address_shop'
import RankDistributorModel from '../models/rank_distributor_model'

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
				path: 'carts',
				populate: [{ path: 'user' }, { path: 'product' }]
			})
			.populate({
				path: 'shops',
				populate: [
						{ path: 'owner' },
						{ 
							path: 'layer_depth_rewards',
							populate: [
								{ path: 'shop' }
							],
							options: { sort: {layer: 1} }
						},
					 	{ path: 'addressShop' },
						{ path: 'addressShop' },
						{ 
							path: 'rank_distributors',
							populate: [
								{path: 'reward'},
								{path: 'condition'},
								{path: 'treatment'}
							],
							options: { sort: { no: 1}}
						},
						{ path: 'rank_members' },
						{ path: 'rank_staffs' },
						{ path: 'point_distributors' },
						{ path: 'point_members' },
						{ path: 'point_staffs' },
						{ path: 'point_distributors' },
						{ path: 'point_members' },
						{ path: 'point_staffs' },
						{ 
							path: 'memberCustomers',
							populate: [
								{path: 'rank'},
								{path: 'data'},
								{path: 'shop'},
								{path: 'point'},
								{
									path: 'reward',
									populate: [
										{path: 'rewardPoint'},
										{path: 'rewardRank'}
									]
								}
							]
						},
						{
							path: 'distributors',
							populate: [
								{path: 'data'},
								{path: 'rank'},
								{path: 'shop'},
								{path: 'point'},
								{
									path: 'reward',
									populate: [
										{path: 'rewardPoint'},
										{
											path: 'rewardRank',
											populate: {path: 'reward'}
										}
									]
								}
							]
						},
						{
							path: 'staffs',
							populate: [
								{path: 'data'},
								{path: 'rank'},
								{path: 'branch'},
								{path: 'point'},
								{
									path: 'reward',
									populate: [
										{path: 'rewardPoint'},
										{path: 'rewardRank'}
									]
								},
								{
									path: 'workSchedules',
									populate: [
										{path: 'rank'},
										{path: 'user'}
									]
								}
							]
						},
						{
							path: 'products',
							populate: [
								{
									path: 'num_of_stock',
									populate: [
										{
											path: 'stockEdit',
											populate: {
												path: 'stock',
												populate: { path: 'product' }
											}
										},
										{
											path: 'product'
										}
									]
								},
								{path: 'owner'},
								{path: 'user'},
								{path: 'pickUpFrom'},
								{
									path: 'imageUrl',
									populate: {path:'product'}
								},
								{path: 'status_show'},
								{path: 'status_product'},
								{path: 'productWholeSale'},
								{path: 'num_of_stock'},
								{path: 'type'},
								{path: 'shops'}
							]
						}
					]
			})
	},
	users: (parent, args, context, info) =>
		User.find({})
			.populate({
				path: 'address',
				populate: { path: 'user' }
			})
			.populate({
				path: 'shops',
				populate: {
					path: 'products',
					populate: [
						
					]
				}
			})
			.populate({
				path: 'carts',
				populate: [{ path: 'user' }, { path: 'product' }]
			})
			.populate({
				path: 'shops',
				populate: [
						{path: 'owner' },
					 	{ path: 'addressShop' },
						{ path: 'addressShop' },
						{ 
							path: 'rank_distributors',
							populate: [
								{path: 'reward'},
								{path: 'condition'},
								{path: 'treatment'}
							],
							options: { sort: { no: 1}}
						},
						{ 
							path: 'rank_distributors',
							populate: [
								{path: 'reward'},
								{path: 'condition'},
								{path: 'treatment'}
							],
							options: { sort: { no: 1}}
						},
						{ path: 'rank_members' },
						{ path: 'rank_staffs' },
						{ path: 'point_distributors' },
						{ path: 'point_members' },
						{ path: 'point_staffs' },
						{ 
							path: 'memberCustomers',
							populate: [
								{path: 'rank'},
								{path: 'data'},
								{path: 'shop'},
								{path: 'point'},
								{path: 'reward'}
							]
						},
						{
							path: 'distributors',
							populate: [
								{path: 'data'},
								{path: 'rank'},
								{path: 'shop'},
								{path: 'point'},
								{path: 'reward'}
							]
						},
						{
							path: 'staffs',
							populate: [
								{path: 'data'},
								{path: 'rank'},
								{path: 'branch'},
								{path: 'point'},
								{path: 'reward'},
								{
									path: 'workSchedules',
									populate: [{path: 'rank'},{path: 'user'}]
								}
							]
						},
						{
							path: 'products',
							populate: [
								{
									path: 'num_of_stock',
									populate: {
										path: 'stockEdit',
										populate: {
											path: 'stock',
											populate: { path: 'product' }
										}
									}
								},
								{path: 'owner'},
								{path: 'user'},
								{path: 'pickUpFrom'},
								{
									path: 'imageUrl',
									populate: {path:'product'}
								},
								{path: 'status_show'},
								{path: 'status_product'},
								{path: 'productWholeSale'},
								{path: 'num_of_stock'},
								{path: 'type'},
								{path: 'shops'}
							]
						}
					]
			}),
	addresses: (parent, args, {userId}, info) => {
		const {
			address,
			sub_area,
			district,
			province,
			postal_code
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.')

		// เข็คว่ามี address ID หรือไม่
		if (!address && !sub_area 
			&& !district && !province && !postal_code) return Address.find({})
			.populate({
				path: 'user',
				populate: {path: 'address'}
			})

		const addresses = Address.find({})
			.populate({
				path: 'user',
				populate: { path: 'address' }
			})
		// ถ้ามี จังหวัด
		if (province && province !== "") {
			const provinces = addresses.find({province: `${province}`})
			// ถ้ามี รหัสไปร
			if (postal_code && postal_code !== "") {
				const postal_codes = provinces.find({postal_code: `${postal_code}`})
				// ถ้ามี อำเภอ 
				if (district && district !== "") {
					const districts = postal_codes.find({district: `${district}`})
					//ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = districts.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return districts
					}
				} else {
					// ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = postal_codes.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return postal_codes
					}
				}
			} else {
				// ถ้ามี อำเภอ 
				if (district && district !== "") {
					const districts = provinces.find({district: `${district}`})
					//ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = districts.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return districts
					}
				} else {
					// ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = provinces.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return provinces
					}
				}
			}
		} else {
			// ถ้ามี รหัสไปร
			if (postal_code && postal_code !== "") {
				const postal_codes = addresses.find({postal_code: `${postal_code}`})
				// ถ้ามี อำเภอ 
				if (district && district !== "") {
					const districts = postal_codes.find({district: `${district}`})
					//ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = districts.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return districts
					}
				} else {
					// ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = postal_codes.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return postal_codes
					}
				}
			} else {
				// ถ้ามี อำเภอ 
				if (district && district !== "") {
					const districts = addresses.find({district: `${district}`})
					//ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = districts.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return districts
					}
				} else {
					// ถ้ามี ตำบล
					if (sub_area && sub_area !== "") {
						const sub_areas = addresses.find({sub_area: `${sub_area}`})
						return sub_areas
					} else {
						return addresses
					}
				}
			}
		}
	},
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
			.populate(
				[
					{
						path: 'imageUrl',
						populate: { path: 'product' }
					},
					{
						path: 'status_show',
						populate: { path: 'product' }
					},
					{
						path: 'status_product',
						populate: { path: 'product' }
					},
					{
						path: 'num_of_stock',
						populate: { path: 'product' }
					},
					{
						path: 'productWholeSale',
						populate: { path: 'product' }
					},
					{
						path: 'type',
						populate: { path: 'product' }
					},
					{
						path: 'num_of_stock',
						populate: [
							{path: 'product'},
							{
								path: 'stockEdit',
								populate: {
									path: 'stock',
									populate: {path: 'product'}
								}
							}
						]
					},
					{
						path: 'shops',
						populate: {path: 'products'}
					},
					{
						path: 'owner',
						populate: {path: 'product'}
					},
					{
						path: 'user',
						populate: {path: 'product'}
					},
					{
						path: 'pickUpFrom',
						populate: {path: 'product'}
					}
				]
			),
	products: (parent, args, context, info) =>
		Product.find({})
			.populate({
				path: 'traffic',
				populate: { path: 'product' }
			})
			.populate({
				path: 'user',
				populate: { path: 'address', path: 'product' }
			})
			.populate(
				[
					{
						path: 'imageUrl',
						populate: { path: 'product' }
					},
					{
						path: 'status_show',
						populate: { path: 'product' }
					},
					{
						path: 'status_product',
						populate: { path: 'product' }
					},
					{
						path: 'num_of_stock',
						populate: { path: 'product' }
					},
					{
						path: 'productWholeSale',
						populate: { path: 'product' }
					},
					{
						path: 'type',
						populate: { path: 'product' }
					},
					{
						path: 'num_of_stock',
						populate: [
							{path: 'product'},
							{
								path: 'stockEdit',
								populate: {
									path: 'stock',
									populate: {path: 'product'}
								}
							}
						]
					},
					{
						path: 'shops',
						populate: {path: 'products'}
					},
					{
						path: 'owner',
						populate: {path: 'product'}
					},
					{
						path: 'user',
						populate: {path: 'product'}
					},
					{
						path: 'pickUpFrom',
						populate: {path: 'product'}
					}
				]
			)
			.sort({ createdAt: 'desc' })
};

export default Query;
