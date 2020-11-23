import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user';
import Address from '../models/address';
import Product from '../models/product';
import Traffic from '../models/traffic';
import CartItem from '../models/cartitem';
import ImageUrl from '../models/imageurl';
import StatusProduct from '../models/statusproduct';
import StatusShow from '../models/statusshow';
import Stock from '../models/stock';
import ProductType from '../models/producttype';
import StockEdit from '../models/stockedit';
import ProductWholeSale from '../models/productwholesale'
import Shop from '../models/shop'
import AddressShop from '../models/address_shop'
import RankDisModel from '../models/rank_distributor_model'
import RankMemModel from '../models/rank_member_model'
import RankStaffModel from '../models/rank_staff_model'
import RewardPointDisModel from '../models/reward_point_distributor_model'
import RewardPointMemModel from '../models/reward_point_member_model'
import RewardPointStaffModel from '../models/reward_point_staff_model'
import MemberCustomer from '../models/member_customer'
import Distributor from '../models/distributor'
import Staff from '../models/staff'
import PointMember from '../models/point_member'
import PointDis from '../models/point_distributor'
import PointStaff from '../models/point_staff'
import RewardMember from '../models/reward_member'
import RewardDis from '../models/reward_distributor'
import RewardStaff from '../models/reward_staff'
import WorkSchedule from '../models/work_schedule'
import ReRankDisModel from '../models/reward_rank_dis_model'
import ConRankDisModel from '../models/condition_rank_dis_model'
import TreRankDisModel from '../models/treatment_rank_dis_model'
import LayerDepthReward from '../models/layer_depth_reward'

const Mutation = {
	//! Sign Up
	signup: async (parent, args, context, info) => {
		// เรียก Username, Email มาเก็บไว้และข้อมูล User ทุกคนสำหรับเช็ค
		const username = args.username.trim().toLowerCase();
		const email = args.email.trim().toLowerCase();
		const currentUser = await User.find({});

		if (
			!args.username ||
			!args.password ||
			!args.confirmPassword ||
			!args.fname ||
			!args.lname ||
			!args.birthday ||
			args.birthday === null ||
			!args.sex ||
			!args.email ||
			!args.authority
		)
			throw new Error('Please fill out all information.');

		if(!args.imageUrl) {
			args.imageUrl = 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png'
		}

		// เช็ค Username ใน Data Base ว่ามีซ้ำหรือไม่และมีตัวอักษรมากว่า 64 ตัวหรือไม่
		const isUsernameExist =
			currentUser.findIndex((u) => u.username === username) > -1;
		if (isUsernameExist) throw new Error('Username already exist.');
		if (args.username.trim().length > 64)
			throw new Error('Username has more than 64 characters.');

		// เช็ค Email ใน Data Base ว่ามีซ้ำหรือไม่
		const isEmailExist = currentUser.findIndex((u) => u.email === email) > -1;
		if (isEmailExist) throw new Error('Email already exist.');

		// ตรวจสอบว่า Password น้อยกว่า 6 ตัวหรือไม่
		if (args.password.trim().length < 6)
			throw new Error('Password must be at least 6 characters.');

		if (args.password !== args.confirmPassword)
			throw new Error('Password and confirmation password do not match.');

		// ทำการ Has Password
		const password = await bcrypt.hash(args.password, 10);

		return User.create({ ...args, username, email, password });
	},
	//! Login
	login: async (parent, args, context, info) => {
		const { username, password } = args;

		if (!username || !password)
			throw new Error('Please fill out all information.');

		// เช็คว่า username หรือ email มีใน database หรือไม่
		const user = await User.findOne({ username })
			.populate({
				path: 'address',
				populate: { path: 'user' }
			})
			.populate({
				path: 'products',
				populate: {
					path: 'imageUrl',
					populate: { path: 'product' }
				}
			})
			.populate({
				path: 'products',
				populate: { path: 'user' }
			})
			.populate({
				path: 'carts',
				populate: { path: 'user' }
			})
			.populate({
				path: 'carts',
				populate: { path: 'product' }
			})
			.populate({
				path: 'products',
				populate: {
					path: 'type',
					populate: { path: 'product' }
				}
			})
			.populate({
				path: 'products',
				populate: {
					path: 'num_of_stock',
					populate: { path: 'product' }
				}
			})
			.populate({
				path: 'products',
				populate: {
					path: 'num_of_stock',
					populate: {
						path: 'stockEdit',
						populate: {
							path: 'stock',
							populate: { path: 'product' }
						}
					}
				}
			});

		if (!user) throw new Error('User not found, please sign up.');

		// เช็คว่า password ถูกต้อง
		// แปลง password เพื่อเทียบว่า password ที่ใส่มากับ password ใน database ตรงกันไหม
		const validPassword = await bcrypt.compare(password, user.password);

		// ถ้าผิดทำการส่งข้อความ
		if (!validPassword) throw new Error('Invalid username or password.');

		const token = jwt.sign({ userId: user.id }, process.env.SECRET, {
			expiresIn: '7days'
		});

		return { user, jwt: token };
	},
	//! Phone
	addPhone: async (parent, args, { userId }, info) => {
		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		//เช็คว่ามีการใส่เบอร์แล้ว และเช็คว่าเบอร์มีตัวอักษร 10 ตัว
		if (!args.phone) throw new Error('Please provide required fields.');
		if (args.phone.trim().length < 10 || args.phone.trim().length > 10)
			throw new Error('Invalid mobile number.');

		const user = await User.findById(userId);
		// ทำการส่งรหัสไปที่เบอร์มือถือที่ใส่มาเพื่อยืนยันว่าเป็นเบอร์ของผู้ใช้จริงๆ

		// เช็คว่าถ้า user ไม่มีตาราง phone ให้ทำการสร้างและเพิ่มเบอร์ลงไป
		if (!user.phone) {
			user.phone = args.phone;
		} else {
			throw new Error('The user already has a phone number');
		}

		await user.save();
		return User.findById(user.id);
	},
	updatePhone: async (parent, args, { userId }, info) => {
		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');
		const user = await User.findById(userId);

		// เช็คว่ามีการใส่เบอร์แล้ว และเช็คว่าเบอร์มีตัวอักษร 10 ตัว
		if (
			!user.phone ||
			args.phone.trim().length < 10 ||
			args.phone.trim().length > 10
		)
			throw new Error(
				"The user doesn't have a mobile phone number or mobile number entered incorrectly."
			);

		// ทำการส่งรหัสไปที่เบอร์มือถือที่ใส่มาเพื่อยืนยันว่าเป็นเบอร์ของผู้ใช้จริงๆ

		// ทำการอัพเดต Phone
		await User.findByIdAndUpdate(userId, {
			phone: !!args.phone ? args.phone : user.phone // ถ้า args.phone ไม่ว่างเปล่าให้ใส่ args.phone ลงไปแต่ถ้าไม่ให้ใส่ user.phone ลงไปเหมือนเดิม
		});

		const updatedPhone = await User.findById(userId);

		// return ค่า
		return updatedPhone;
	},
	//! Address
	addAddress: async (parent, args, { userId }, info) => {
		const user = await User.findById(userId);
		const { address, sub_area, district, province, postal_code } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่าใส่ที่อยู่ครบทุกช่องแล้วหรือไม่
		if (!address || !sub_area || !district || !province || !postal_code)
			throw new Error('Please provide all required fields.');

		// สร้าง address ขึ้นมา
		const addressCreate = await Address.create({ ...args, user: userId });

		// เช็คว่า user มีตาราง address หรือยัง
		if (!user.address) {
			user.address = [addressCreate];
		} else {
			user.address.push(addressCreate);
		}

		// save ข้อมูล user
		await user.save();

		// return ค่า
		return Address.findById(addressCreate.id).populate({
			path: 'user',
			populate: { path: 'address' }
		});
	},
	updateAddress: async (parent, args, { userId }, info) => {
		const { id, address, sub_area, district, province, postal_code } = args;

		// หา address และ user ใน Database
		const addressId = await Address.findById(id);

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามี address ID ที่จะแก้ไขหรือไม่
		if (!addressId) throw new Error('There are no address IDs mentioned.');

		// เช็คว่า address นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== addressId.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข address ใน Database
		await Address.findByIdAndUpdate(id, {
			address: !!address ? address : addressId.address,
			sub_area: !!sub_area ? sub_area : addressId.sub_area,
			district: !!district ? district : addressId.district,
			province: !!province ? province : addressId.province,
			postal_code: !!postal_code ? postal_code : addressId.postal_code
		});

		// ค้นหา Address ที่จะอัพเดต
		const updatedAddress = await Address.findById(id).populate({
			path: 'user',
			populate: { path: 'address' }
		});

		// return ค่า
		return updatedAddress;
	},
	deleteAddress: async (parent, args, { userId }, info) => {
		const { id } = args;

		// ค้นหา user และ address ใน database
		const user = await User.findById(userId);
		const addressId = await Address.findById(id);

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่า user เป็นเจ้าของ address หรือไม่
		if (userId !== addressId.user.toString())
			throw new Error('You not authorized.');

		// ลบ Address
		const deletedAddress = await Address.findByIdAndRemove(id);

		// อัพเดต user.address ใหม่เพราะมี addres ลบไป
		const updatedUserAddress = user.address.filter(
			(addressId) => addressId.toString() !== deletedAddress.id.toString()
		);
		await User.findByIdAndUpdate(userId, { address: updatedUserAddress });

		// return ค่า
		return deletedAddress;
	},
//! Shop
	addShop: async (parent, args, {userId}, info) => {
		const {
			profileShop, 
			shopName, 
			storeFront, 
			layer_depth, 
			workforce_per_row,
			dis_stock,
			dis_no_stock,
			dis_system
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user
		const user = await User.findById(userId)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!shopName) throw new Error('Please provide all required fields.');

		//ถ้ารูปภาพว่างเปล่าให้ใช้รูปที่มีให้แทน
		if (profileShop === '' || profileShop === undefined || profileShop === null) profileShop = 'https://cdn.pixabay.com/photo/2016/05/01/01/59/bee-1364329_1280.jpg'
		
		// สร้าง Shop ขึ้นมา
		const ShopCreate = await Shop.create({ ...args, owner: user });

		// เช็คว่าถ้า user ไม่มีตาราง shop ให้ทำการสร้างและเพิ่ม
		if (!user.shops) {
			user.shops = [ShopCreate];
		} else {
			user.shops.push(ShopCreate);
		}

		// save ข้อมูล product
		await user.save();

		// return ค่า
		return Shop.findById(ShopCreate.id).populate({
			path: 'owner',
			populate: { path: 'shops' }
		});
	},
	updateShop: async (parent, args, { userId }, info) => {
		const { 
			idShop, 
			profileShop, 
			shopName, 
			storeFront, 
			layer_depth, 
			workforce_per_row,
			dis_stock,
			dis_no_stock,
			dis_system
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

			console.log('shopID-->', shopID)

		// ทำการแก้ไข Shop ใน Database
		await Shop.findByIdAndUpdate(idShop, {
			profileShop: !!profileShop ? profileShop : shopID.profileShop, 
			shopName: !!shopName ? shopName : shopID.shopName, 
			storeFront: !!storeFront ? storeFront : shopID.storeFront, 
			layer_depth: !!layer_depth || layer_depth == 0 ? layer_depth : shopID.layer_depth, 
			workforce_per_row: !!workforce_per_row || workforce_per_row == 0 ? workforce_per_row : shopID.workforce_per_row,
			dis_stock: !!dis_stock || dis_stock == false ? dis_stock : shopID.dis_stock,
			dis_no_stock: !!dis_no_stock || dis_no_stock == false ? dis_no_stock : shopID.dis_no_stock,
			dis_system: !!dis_system || dis_system == false ? dis_system : shopID.dis_system
		});

		// ค้นหา Shop ที่จะอัพเดต
		const updatedShop = await Shop.findById(idShop).populate({
			path: 'owner',
			populate: { path: 'shops' }
		});

		// return ค่า
		return updatedShop;
	},
	deleteShop: async (parent, args, { userId }, info) => {
		const { idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop ใน database
		const shopID = await Shop.findById(idShop);
		const user = await User.findById(userId)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ Shop
		const deletedShop = await Shop.findByIdAndRemove(
			shopID
		).populate({
			path: 'owner',
			populate: { path: 'shops' }
		});

		// อัพ user.shops ใหม่เพราะมี shop ลบไป
		const updatedShopUser = user.shops.filter(
			(shopId) => shopId.toString() !== deletedShop.id.toString()
		);
		await User.findByIdAndUpdate(user, {
			shops: updatedShopUser
		});

		// return ค่า
		return deletedShop;
	},
//! Layer Depth Reward
	addLayerDepthReward: async (parent, args, {userId}, info) => {
		const {
			layer,
			type,
			discount,
			idShop
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user
		const user = await User.findById(userId)
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!type) throw new Error('Please provide all required fields.');
		
		// สร้าง Shop ขึ้นมา
		const LayerDepthRewardCreate = await LayerDepthReward.create({ ...args, shop: idShop });

		// เช็คว่าถ้า user ไม่มีตาราง shop ให้ทำการสร้างและเพิ่ม
		if (!shopID.layer_depth_rewards) {
			shopID.layer_depth_rewards = [LayerDepthRewardCreate];
		} else {
			shopID.layer_depth_rewards.push(LayerDepthRewardCreate);
		}

		// save ข้อมูล product
		await shopID.save();

		// return ค่า
		return LayerDepthReward.findById(LayerDepthRewardCreate.id).populate({
			path: 'shop',
			populate: { path: 'layer_depth_rewards' }
		});
	},
	updateLayerDepthReward: async (parent, args, { userId }, info) => {
		const { 
			idLayerDepthReward,
			idShop,
			layer,
			type,
			discount
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const layerDepthRewardID = await LayerDepthReward.findById(idLayerDepthReward)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// ทำการแก้ไข Shop ใน Database
		await layerDepthRewardID.findByIdAndUpdate(idLayerDepthReward, {
			layer: !!layer || layer==0 ? layer : layerDepthRewardID.layer,
			type: !!type ? type : layerDepthRewardID.type,
			discount: !!discount || discount == 0 ? discount : layerDepthRewardID.discount,
		});

		// ค้นหา Shop ที่จะอัพเดต
		const updatedLayerDepthReward = await LayerDepthReward.findById(idLayerDepthReward).populate({
			path: 'shop',
			populate: { path: 'layer_depth_rewards' }
		});

		// return ค่า
		return updatedLayerDepthReward;
	},
	deleteLayerDepthReward: async (parent, args, { userId }, info) => {
		const { idLayerDepthReward, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop ใน database
		const shopID = await Shop.findById(idShop);
		const user = await User.findById(userId)
		const layerDepthRewardID = await LayerDepthReward.findById(idLayerDepthReward)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ Shop
		const deletedLayerDepthReward = await LayerDepthReward.findByIdAndRemove(
			layerDepthRewardID
		).populate({
			path: 'shop',
			populate: { path: 'layer_depth_rewards' }
		});

		// อัพ user.shops ใหม่เพราะมี shop ลบไป
		const updatedLayerDepthReward = shopID.layer_depth_rewards.filter(
			(laDeReId) => laDeReId.toString() !== deletedLayerDepthReward.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			layer_depth_rewards: updatedLayerDepthReward
		});

		// return ค่า
		return deletedLayerDepthReward;
	},
//! Address Shop
	addAddressShop: async (parent, args, {userId}, info) => {
		const {
			idShop,
			address, 
			sub_area, 
			district, 
			province, 
			postal_code
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!address || !sub_area || !district || !province || !postal_code) throw new Error('Please provide all required fields.');
		
		// สร้าง Shop ขึ้นมา
		const AddressShopCreate = await AddressShop.create({ 
			address: address, 
			sub_area: sub_area, 
			district: district, 
			province: province, 
			postal_code: postal_code, 
			shop: shopID 
		});

		// เช็คว่าถ้า shop ไม่มีตาราง addressShop ให้ทำการสร้างและเพิ่ม
		shopID.addressShop = AddressShopCreate;
		

		// save ข้อมูล product
		await shopID.save();

		// return ค่า
		return AddressShop.findById(AddressShopCreate.id)
		.populate({
			path: 'shop',
			populate: { path: 'addressShop' }
		});
	},
	updateAddressShop: async (parent, args, { userId }, info) => {
		const { 
			idShop,
			idAdd,
			address, 
			sub_area, 
			district, 
			province, 
			postal_code 
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const addressID = await AddressShop.findById(idAdd)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข AddresShop ใน Database
		await AddressShop.findByIdAndUpdate(idAdd, {
			address: !!address ? address : addressID.shop.address, 
			sub_area: !!sub_area ? sub_area : addressID.shop.sub_area, 
			district: !!district ? district : addressID.shop.district, 
			province: !!province ? province : addressID.shop.province, 
			postal_code: !!postal_code ? postal_code : addressID.shop.postal_code
		});

		// ค้นหา Address Shop ที่จะอัพเดต
		const updatedAddressShop = await AddressShop.findById(idAdd).populate({
			path: 'shop',
			populate: { path: 'addressShop' }
		});

		// return ค่า
		return updatedAddressShop;
	},
	deleteAddressShop: async (parent, args, { userId }, info) => {
		const { idAddress, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and address shop ใน database
		const addressShopID = await AddressShop.findById(idAddress);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ address shop
		const deletedAddressShop = await AddressShop.findByIdAndRemove(
			addressShopID
		).populate({
			path: 'shop',
			populate: { path: 'addressShop' }
		});

		// อัพ shop.addressShop ใหม่เพราะมี shop ลบไป
		const updatedAddressShop = null
		await Shop.findByIdAndUpdate(idShop, {
			addressShop: updatedAddressShop
		});

		// return ค่า
		return deletedAddressShop;
	},
//! Product
	addProduct: async (parent, args, { userId }, info) => {
		const {
			idOwner,
			idShop,
			idPickUpFrom,
			name,
			description,
			price,
			min_of_stock,
			discountType,
			discount,
			discountTimeStart,
			discountTimeEnd,
			mem_point,
			dis_point,
			SKU,
			ParentSKU
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user ใน database
		const user = await User.findById(userId);
		const owner = await User.findById(idOwner)
		const pickFrom = await User.findById(idPickUpFrom)
		const shop = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!name || !price || !min_of_stock || !ParentSKU)
			throw new Error('Please provide all required fields.');

		// สร้าง product ขึ้นมา
		const productCreate = await Product.create({ 
			name: name,
			description: description,
			price: price,
			min_of_stock: min_of_stock,
			discountType: discountType,
			discount: discount,
			discountTimeStart: discountTimeStart,
			discountTimeEnd: discountTimeEnd,
			mem_point: mem_point,
			dis_point: dis_point,
			SKU:SKU,
			ParentSKU:ParentSKU,
			user: user,
			owner: owner,
			shops: shop,
			pickUpFrom: pickFrom
		});

		// เช็คว่าถ้า user ไม่มีตาราง products ให้ทำการสร้างและเพิ่ม
		if (!shop.products) {
			shop.products = [productCreate];
		} else {
			shop.products.push(productCreate);
		}

		// save ข้อมูล user
		await shop.save();

		// return ค่า
		return Product.findById(productCreate.id)
			.populate({
				path: 'shops',
				populate: { path: 'products' }
			})
			.populate({
				path: 'traffic',
				populate: { path: 'product' },
				populate: { path: 'imageUrl', populate: { path: 'product' } }
			})
			.populate({
				path: 'status_show',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_product',
				populate: { path: 'product' }
			})
			.populate({
				path: 'num_of_stock',
				populate: { path: 'product' }
			})
			.populate({
				path: 'type',
				populate: { path: 'product' }
			})
			.populate({
				path: 'user',
				populate: { path: 'shops' }
			})
			.populate({
				path: 'owner',
				populate: { path: 'products' }
			})
			.populate({
				path: 'pickUpFrom',
				populate: { path: 'shops' }
			})
	},
	updateProduct: async (parent, args, { userId }, info) => {
		const {
			id,
			idOwner,
			idShop,
			idPickUpFrom,
			name,
			description,
			price,
			min_of_stock,
			discountType,
			discount,
			discountTimeStart,
			discountTimeEnd,
			mem_point,
			dis_point,
			SKU,
			ParentSKU
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา product และ user ใน Database
		const productId = await Product.findById(id);
		const owner = await User.findById(idOwner)
		const pickFrom = await User.findById(idPickUpFrom)
		const shop = await Shop.findById(idShop)

		// เช็คว่ามี product ID ที่จะแก้ไขหรือไม่
		if (!productId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า product นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== productId.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข product ใน Database
		await Product.findByIdAndUpdate(id, {
			name: !!name ? name : productId.name,
			description: !!description ? description : productId.description,
			price: !!price ? price : productId.price,
			min_of_stock: !!min_of_stock ? min_of_stock : productId.min_of_stock,
			discountType: !!discountType ? discountType : productId.discountType,
			discount: !!discount ? discount : productId.discount,
			discountTimeStart: !!discountTimeStart
				? discountTimeStart
				: productId.discountTimeStart,
			discountTimeEnd: !!discountTimeEnd
				? discountTimeEnd
				: productId.discountTimeEnd,
			mem_point: !!mem_point ? mem_point : productId.mem_point,
			dis_point: !!dis_point ? dis_point : productId.dis_point,
			SKU: !!SKU ? SKU : productId.SKU,
			ParentSKU: !!ParentSKU ? ParentSKU : productId.ParentSKU,
			pickUpFrom: !!pickFrom ? pickFrom : productId.pickUpFrom
		});

		// ค้นหา product ที่จะอัพเดต
		const updatedProduct = await Product.findById(id)
			.populate({
				path: 'shops',
				populate: { path: 'products' }
			})
			.populate({
				path: 'traffic',
				populate: { path: 'product' },
				populate: { path: 'imageUrl', populate: { path: 'product' } }
			})
			.populate({
				path: 'status_show',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_product',
				populate: { path: 'product' }
			})
			.populate({
				path: 'stock',
				populate: { path: 'product' }
			})
			.populate({
				path: 'type',
				populate: { path: 'product' }
			})
			.populate({
				path: 'owner',
				populate: {path: 'product'}
			})
			.populate({
				path: 'user',
				populate: {path: 'product'}
			})
			.populate({
				path: 'pickUpFrom',
				populate: {path: 'product'}
			})

		// return ค่า
		return updatedProduct;
	},
	deleteProduct: async (parent, args, { userId }, info) => {
		const { idPro, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user และ product ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(idPro);
		const shop = await Shop.findById(idShop);

		// เช็คว่า user เป็นเจ้าของ product หรือไม่
		if (userId !== product.user.toString())
			throw new Error('You not authorized.');

		// ลบ product
		const deletedProduct = await Product.findByIdAndRemove(idPro)
			.populate({
				path: 'shops',
				populate: { path: 'products' }
			})
			.populate({
				path: 'traffic',
				populate: { path: 'product' },
				populate: { path: 'imageUrl', populate: { path: 'product' } }
			})
			.populate({
				path: 'status_show',
				populate: { path: 'product' }
			})
			.populate({
				path: 'status_product',
				populate: { path: 'product' }
			})
			.populate({
				path: 'stock',
				populate: { path: 'product' }
			})
			.populate({
				path: 'type',
				populate: { path: 'product' }
			})
			.populate({
				path: 'owner',
				populate: {path: 'product'}
			})
			.populate({
				path: 'user',
				populate: {path: 'product'}
			})
			.populate({
				path: 'pickUpFrom',
				populate: {path: 'product'}
			})

		// อัพ user.product ใหม่เพราะมี product ลบไป
		const updatedUserProduct = shop.products.filter(
			(productId) => productId.toString() !== deletedProduct.id.toString()
		);
		await Shop.findByIdAndUpdate(idShop, {
			products: updatedUserProduct
		});

		// return ค่า
		return deletedProduct;
	},
	//! Cart
	addToCart: async (parent, args, { userId }, info) => {
		const { id } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');
		try {
			// ค้นหา user ว่าใครเป็นคนเพิ่มสินค้า
			const user = await User.findById(userId).populate({
				path: 'carts',
				populate: { path: 'product' }
			});

			// เช็คว่าสินค้าที่แอดเข้ามามีอยู่ในตะกร้าสินค้าหรือยัง
			const findCartItemIndex = user.carts.findIndex(
				(cartItem) => cartItem.product.id === id
			); //ถ้ามีแล้วมันจะคืนค่า Index > -1 (เป็นเลข Index ของ Product นั้นๆ)

			if (findCartItemIndex > -1) {
				// A. ถ้ามีในตะกร้าแล้ว
				// A.1 ค้นหา cartItem ใน database และ update
				user.carts[findCartItemIndex].quantity += 1;
				await CartItem.findByIdAndUpdate(user.carts[findCartItemIndex].id, {
					quantity: user.carts[findCartItemIndex].quantity
				});

				// A.2 ค้นหา updatedCartItem
				const updatedCartItem = await CartItem.findById(
					user.carts[findCartItemIndex].id
				)
					.populate({ path: 'product' })
					.populate({ path: 'user' });

				return updatedCartItem;
			} else {
				// B. ถ้ายังไม่มีในตะกร้า
				// B.1 สร้าง new CartItem
				const cartItem = await CartItem.create({
					product: id,
					quantity: 1,
					user: userId
				});
				// B.2 ค้นหา new CartItem
				const newCartItem = await CartItem.findById(cartItem.id)
					.populate({ path: 'product' })
					.populate({ path: 'user' });

				// B.3 Update user.carts
				await User.findByIdAndUpdate(userId, {
					carts: [...user.carts, newCartItem]
				});

				return newCartItem;
			}
		} catch (error) {
			console.log(error);
		}
	},
	deleteOneInCart: async (parent, args, { userId }, info) => {
		// id == productId in cart
		const { id } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user ว่าใครเป็นคนลบสินค้า
		const user = await User.findById(userId).populate({
			path: 'carts',
			populate: { path: 'product' }
		});

		// เช็คว่าสินค้าที่จะลบมีอยู่ในตะกร้าหรือไม่
		const findCartItemIndex = user.carts.findIndex(
			(cartItem) => cartItem.product.id === id
		); //ถ้ามีแล้วมันจะคืนค่า Index > -1 (เป็นเลข Index ของ Product นั้นๆ)

		if (findCartItemIndex > -1) {
			// ถ้ามี
			// ค้นหา cartItem ใน database และ update quantity
			// ถ้า quantity >= 1 ให้ลดลงไป 1
			if (user.carts[findCartItemIndex].quantity >= 2) {
				user.carts[findCartItemIndex].quantity -= 1;
				await CartItem.findOneAndUpdate(user.carts[findCartItemIndex].id, {
					quantity: user.carts[findCartItemIndex].quantity
				});

				// updated cartItem เพราะ quantity มีการเปลี่ยนแปลง
				const updatedCartItem = await CartItem.findById(
					user.carts[findCartItemIndex].id
				)
					.populate({ path: 'product' })
					.populate({ path: 'user' });

				return updatedCartItem;
			} else {
				throw new Error('There are no products to delete in the cart.');
			}
		} else {
			// ถ้าไม่มี
			// ให้แสดงข้อความว่าไม่มีสินค้าดังกล่าวใน cartItem
			throw new Error('There are no products to delete in the cart.');
		}
	},
	deleteAllInCart: async (parent, args, { userId }, info) => {
		// id == cartId
		const { id } = args;

		// เช็คว่ามี user
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user
		const user = await User.findById(userId);

		// Find cart from given id
		const cart = await CartItem.findById(id);

		// Check owner ship of the cart
		if (cart.user.toString() !== userId) {
			throw new Error('Not authotized.');
		}

		// Delete cart
		const deletedCart = await CartItem.findByIdAndRemove(id);

		const updatedUserCart = user.carts.filter(
			(cartId) => cartId.toString() !== deletedCart.id.toString()
		);
		await User.findByIdAndUpdate(userId, { carts: updatedUserCart });

		return deletedCart;
	},
	//! Image Product
	addImageUrlProduct: async (parent, args, { userId }, info) => {
		const { id, imageUrl } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const product = await Product.findById(id);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!id || !imageUrl)
			throw new Error('Please provide all required fields.');

		// สร้าง imageUrl ขึ้นมา
		const imageUrlCreate = await ImageUrl.create({ ...args, product: id });

		// เช็คว่าถ้า product ไม่มีตาราง imageUrl ให้ทำการสร้างและเพิ่ม
		if (!product.imageUrl) {
			product.imageUrl = [imageUrlCreate];
		} else {
			product.imageUrl.push(imageUrlCreate);
		}

		// save ข้อมูล product
		await product.save();

		// return ค่า
		return ImageUrl.findById(imageUrlCreate.id).populate({
			path: 'product',
			populate: { path: 'imageUrl' }
		});
	},
	updateImageUrlProduct: async (parent, args, { userId }, info) => {
		const { id, imageUrl } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา imageUrl ใน Database
		const imageUrlId = await ImageUrl.findById(id);

		// เช็คว่ามี imageUrl ID ที่จะแก้ไขหรือไม่
		if (!imageUrlId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า ImageUrl นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== imageUrlId.product.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข ImageUrl ใน Database
		await ImageUrl.findByIdAndUpdate(id, {
			imageUrl: !!imageUrl ? imageUrl : imageUrlId.product.imageUrl
		});

		// ค้นหา imageUrl ที่จะอัพเดต
		const updatedImageUrl = await ImageUrl.findById(id).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// return ค่า
		return updatedImageUrl;
	},
	deleteImageUrlProduct: async (parent, args, { userId }, info) => {
		const { idImg, idPro } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ imageurl ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(idPro);
		const imageUrl = await ImageUrl.findById(idImg);

		// เช็คว่า user เป็นเจ้าของ imageUrl หรือไม่
		if (userId !== imageUrl.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ imageUrl
		const deletedImageUrl = await ImageUrl.findByIdAndRemove(idImg).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// อัพ product.imageurl ใหม่เพราะมี imageUrl ลบไป
		const updatedImageUrlProduct = product.imageUrl.filter(
			(imageUrlId) => imageUrlId.toString() !== deletedImageUrl.id.toString()
		);
		await Product.findByIdAndUpdate(product, {
			imageUrl: updatedImageUrlProduct
		});

		// return ค่า
		return deletedImageUrl;
	},
	//! Status Product 
	addStatusPro: async (parent, args, { userId }, info) => {
		const { id, status } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const product = await Product.findById(id);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!id || !status) throw new Error('Please provide all required fields.');

		// สร้าง status ขึ้นมา
		const statusCreate = await StatusProduct.create({ ...args, product: id });

		// เช็คว่าถ้า product ไม่มีตาราง statusPro ให้ทำการสร้างและเพิ่ม
		if (!product.status_product) {
			product.status_product = [statusCreate];
		} else {
			product.status_product.push(statusCreate);
		}

		// save ข้อมูล product
		await product.save();

		// return ค่า
		return StatusProduct.findById(statusCreate.id).populate({
			path: 'product',
			populate: { path: 'status_product' }
		});
	},
	updateStatusPro: async (parent, args, { userId }, info) => {
		const { id, status } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา statusPro ใน Database
		const statusProId = await StatusProduct.findById(id);

		// เช็คว่ามี statusPro ID ที่จะแก้ไขหรือไม่
		if (!statusProId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า statusPro นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== statusProId.product.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข statusPro ใน Database
		await StatusProduct.findByIdAndUpdate(id, {
			status: !!status ? status : statusProId.product.imageUrl
		});

		// ค้นหา statusPro ที่จะอัพเดต
		const updatedStatus = await StatusProduct.findById(id).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// return ค่า
		return updatedStatus;
	},
	deleteStatusPro: async (parent, args, { userId }, info) => {
		const { idPro, idStaPro } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ statusShow ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(idPro);
		const statusProId = await StatusProduct.findById(idStaPro);

		// เช็คว่า user เป็นเจ้าของ statusShow หรือไม่
		if (userId !== statusProId.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ statusShow
		const deletedStatusPro = await StatusProduct.findByIdAndRemove(
			idStaPro
		).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// อัพ product.status_show ใหม่เพราะมี StatusShow ลบไป
		const updatedStatusProProduct = product.status_show.filter(
			(StatusProId) => StatusProId.toString() !== deletedStatusPro.id.toString()
		);
		await Product.findByIdAndUpdate(product, {
			status_pro: updatedStatusProProduct
		});

		// return ค่า
		return deletedStatusPro;
	},
	//! Status Show
	addStatusShow: async (parent, args, { userId }, info) => {
		const { id, status } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const product = await Product.findById(id);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!id || !status) throw new Error('Please provide all required fields.');

		// สร้าง statusShow ขึ้นมา
		const StatusCreate = await StatusShow.create({ ...args, product: id });

		// เช็คว่าถ้า product ไม่มีตาราง statusShow ให้ทำการสร้างและเพิ่ม
		if (!product.status_show) {
			product.status_show = [StatusCreate];
		} else {
			product.status_show.push(StatusCreate);
		}

		// save ข้อมูล product
		await product.save();

		// return ค่า
		return StatusShow.findById(StatusCreate.id).populate({
			path: 'product',
			populate: { path: 'status_show' }
		});
	},
	updateStatusShow: async (parent, args, { userId }, info) => {
		const { id, status } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา statusShow ใน Database
		const StatusShowId = await StatusShow.findById(id);

		// เช็คว่ามี statusShow ID ที่จะแก้ไขหรือไม่
		if (!StatusShowId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า statusShow นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== StatusShowId.product.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข statusShow ใน Database
		await StatusShow.findByIdAndUpdate(id, {
			status: !!status ? status : StatusShowId.product.status_show
		});

		// ค้นหา statusShow ที่จะอัพเดต
		const updatedStatusShow = await StatusShow.findById(id).populate({
			path: 'product',
			populate: { path: 'status_show' }
		});

		// return ค่า
		return updatedStatusShow;
	},
	deleteStatusShow: async (parent, args, { userId }, info) => {
		const { idStaShow, idPro } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ statusShow ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(idPro);
		const staShowId = await ImageUrl.findById(idStaShow);

		// เช็คว่า user เป็นเจ้าของ statusShow หรือไม่
		if (userId !== staShowId.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ statusShow
		const deletedStaShow = await StatusShow.findByIdAndRemove(
			idStaShow
		).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// อัพ product.imageurl ใหม่เพราะมี imageUrl ลบไป
		const updatedStaShow = product.status_show.filter(
			(statusShowId) => statusShowId.toString() !== deletedStaShow.id.toString()
		);
		await Product.findByIdAndUpdate(product, {
			status_show: updatedStaShow
		});

		// return ค่า
		return deletedStaShow;
	},
	//! Stock
	addStock: async (parent, args, { userId }, info) => {
		const { id, stock, price, cost, statusExpiration, Expiration } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const product = await Product.findById(id).populate({
			path: 'num_of_stock',
			populate: { path: 'product' }
		});
		const StockId = await Stock.findById(id);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!id || !stock || !price || !cost || !statusExpiration)
			throw new Error('Please provide all required fields.');

		// const length = product.num_of_stock.length - 1;

		// สร้าง Stock ขึ้นมา
		const StockCreate = await Stock.create({
			...args,
			stock: !!stock ? stock : StockId.stock,
			product: !!id ? id : StockId.product.id.toString(),
			price: !!price ? price : StockId.price,
			cost: !!cost ? cost : StockId.cost,
			statusExpiration: !!statusExpiration
				? statusExpiration
				: StockId.statusExpiration,
			Expiration: !!Expiration ? Expiration : null
		});

		// เช็คว่าถ้า product ไม่มีตาราง Stock ให้ทำการสร้างและเพิ่ม
		if (!product.num_of_stock) {
			product.num_of_stock = [StockCreate];
		} else {
			product.num_of_stock.push(StockCreate);
		}

		// save ข้อมูล product
		await product.save();

		// return ค่า
		return Stock.findById(StockCreate.id).populate({
			path: 'product',
			populate: { path: 'num_of_stock' }
		});
	},
	updateStock: async (parent, args, { userId }, info) => {
		const { id, stock, price, cost, statusExpiration, Expiration } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Stock ใน Database
		const StockId = await Stock.findById(id);

		// เช็คว่ามี Stock ID ที่จะแก้ไขหรือไม่
		if (!StockId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Stock นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== StockId.product.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข Stock ใน Database
		await Stock.findByIdAndUpdate(id, {
			stock: !!stock ? stock : StockId.stock,
			product: !!id ? id : StockId.product.id.toString(),
			price: !!price ? price : StockId.price,
			cost: !!cost ? cost : StockId.cost,
			statusExpiration: !!statusExpiration
				? statusExpiration
				: StockId.statusExpiration,
			Expiration: !!Expiration ? Expiration : StockId.Expiration
		});

		// ค้นหา Stock ที่จะอัพเดต
		const updatedStock = await Stock.findById(id).populate({
			path: 'product',
			populate: { path: 'num_of_stock' }
		});

		// return ค่า
		return updatedStock;
	},
	deleteStock: async (parent, args, { userId }, info) => {
		const { idPro, idStock } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ imageurl ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(idPro);
		const stockId = await ImageUrl.findById(idStock);

		// เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		if (userId !== stockId.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ Stock
		const deletedStock = await Stock.findByIdAndRemove(idStock).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// อัพ product.num_of_stock ใหม่เพราะมี Stock ลบไป
		const updatedStockProduct = product.num_of_stock.filter(
			(stockId) => stockId.toString() !== deletedStock.id.toString()
		);
		await Product.findByIdAndUpdate(product, {
			num_of_stock: updatedStockProduct
		});

		// return ค่า
		return deletedStock;
	},
	//! Stock Edit
	addStockEdit: async (parent, args, { userId }, info) => {
		const {
			id,
			stockEdit,
			priceEdit,
			costEdit,
			statusExpirationEdit,
			ExpirationEdit,
			createdAt
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const stock = await Stock.findById(id);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (
			!id ||
			!stockEdit ||
			!priceEdit ||
			!costEdit ||
			!statusExpirationEdit ||
			!createdAt
		)
			throw new Error('Please provide all required fields.');

		// สร้าง Stock ขึ้นมา
		const StockEditCreate = await StockEdit.create({ ...args, stock: id });

		// เช็คว่าถ้า product ไม่มีตาราง Stock ให้ทำการสร้างและเพิ่ม
		if (!stock.stockEdit) {
			stock.stockEdit = [StockEditCreate];
		} else {
			stock.stockEdit.push(StockEditCreate);
		}

		// save ข้อมูล product
		await stock.save();

		// return ค่า
		return StockEdit.findById(StockEditCreate.id).populate({
			path: 'stock',
			populate: { path: 'stockEdit' }
		});
	},
	deleteStockEdit: async (parent, args, { userId }, info) => {
		const { idStockEdit, idStock } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ imageurl ใน database
		const stockEditId = await Product.findById(idStockEdit);
		const stockId = await ImageUrl.findById(idStock);

		// เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		if (userId !== stockEditId.stock.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ Stock
		const deletedStockEdit = await StockEdit.findByIdAndRemove(idStockEdit)
			.populate({
				path: 'stock',
				populate: { path: 'product' }
			})
			.populate({ path: 'stock', populate: { path: 'stockEdit' } });

		// อัพ product.num_of_stock ใหม่เพราะมี Stock ลบไป
		const updatedStockEditStock = stock.stockEdit.filter(
			(stockEditId) => stockEditId.toString() !== deletedStockEdit.id.toString()
		);
		await Stock.findByIdAndUpdate(stockId, {
			stockEdit: updatedStockEditStock
		});

		// return ค่า
		return deletedStockEdit;
	},
//! Product Type
	addProductType: async (parent, args, { userId }, info) => {
		const { id, type } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const product = await Product.findById(id);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!id || !type) throw new Error('Please provide all required fields.');

		// สร้าง Stock ขึ้นมา
		const ProTypeCreate = await ProductType.create({ ...args, product: id });

		// เช็คว่าถ้า product ไม่มีตาราง Stock ให้ทำการสร้างและเพิ่ม
		if (!product.type) {
			product.type = [ProTypeCreate];
		} else {
			product.type.push(ProTypeCreate);
		}

		// save ข้อมูล product
		await product.save();

		// return ค่า
		return ProductType.findById(ProTypeCreate.id).populate({
			path: 'product',
			populate: { path: 'type' }
		});
	},
	updateProductType: async (parent, args, { userId }, info) => {
		const { id, type } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Stock ใน Database
		const proTypeId = await ProductType.findById(id);

		// เช็คว่ามี Stock ID ที่จะแก้ไขหรือไม่
		if (!proTypeId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Stock นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== proTypeId.product.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข Stock ใน Database
		await ProductType.findByIdAndUpdate(id, {
			type: !!type ? type : proTypeId.product.type
		});

		// ค้นหา Stock ที่จะอัพเดต
		const updatedProType = await ProductType.findById(id).populate({
			path: 'product',
			populate: { path: 'type' }
		});

		// return ค่า
		return updatedProType;
	},
	deleteProductType: async (parent, args, { userId }, info) => {
		const { idPro, idProType } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ imageurl ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(idPro);
		const proTypeId = await ImageUrl.findById(idProType);

		// เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		if (userId !== proTypeId.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ Stock
		const deletedProType = await ProductType.findByIdAndRemove(
			idProType
		).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// อัพ product.num_of_stock ใหม่เพราะมี Stock ลบไป
		const updatedProTypeProduct = product.type.filter(
			(proTypeId) => proTypeId.toString() !== deletedProType.id.toString()
		);
		await Product.findByIdAndUpdate(product, {
			type: updatedProTypeProduct
		});

		// return ค่า
		return deletedProType;
	},
//! Product Whole Sale
	addProductWholeSale: async (parent, args, { userId }, info) => {
		const { idPro, price, min_sale, max_sale } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา product ใน database
		const product = await Product.findById(idPro);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idPro || !price || !min_sale || !max_sale) throw new Error('Please provide all required fields.');

		// สร้าง Stock ขึ้นมา
		const ProWholeCreate = await ProductWholeSale.create({ ...args, product: idPro });

		// เช็คว่าถ้า product ไม่มีตาราง Stock ให้ทำการสร้างและเพิ่ม
		if (!product.productWholeSale) {
			product.productWholeSale = [ProWholeCreate];
		} else {
			product.productWholeSale.push(ProWholeCreate);
		}

		// save ข้อมูล product
		await product.save();

		// return ค่า
		return ProductWholeSale.findById(ProWholeCreate.id).populate({
			path: 'product',
			populate: { path: 'productWholeSale' }
		});
	},
	updateProductWholeSale: async (parent, args, { userId }, info) => {
		const { idWhole, price, min_sale, max_sale } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Stock ใน Database
		const proWholeId = await ProductWholeSale.findById(idWhole);

		// เช็คว่ามี Stock ID ที่จะแก้ไขหรือไม่
		if (!proWholeId) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Stock นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== proWholeId.product.user.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข Stock ใน Database
		await ProductWholeSale.findByIdAndUpdate(idWhole, {
			price: !!price ? price : proWholeId.product.productWholeSale,
			min_sale: !!min_sale ? min_sale : proWholeId.product.productWholeSale,
			max_sale: !!max_sale ? max_sale : proWholeId.product.productWholeSale
		});

		// ค้นหา Stock ที่จะอัพเดต
		const updatedProWhole = await ProductWholeSale.findById(idWhole).populate({
			path: 'product',
			populate: { path: 'productWholeSale' }
		});

		// return ค่า
		return updatedProWhole;
	},
	deleteProductWholeSale: async (parent, args, { userId }, info) => {
		const { idPro, idWhole } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user product และ imageurl ใน database
		const product = await Product.findById(idPro);
		const proWholeId = await ImageUrl.findById(idWhole);

		// เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		if (userId !== proTypeId.product.user.toString())
			throw new Error('You not authorized.');

		// ลบ Stock
		const deletedProWhole = await ProductWholeSale.findByIdAndRemove(
			proWholeId
		).populate({
			path: 'product',
			populate: { path: 'user' }
		});

		// อัพ product.num_of_stock ใหม่เพราะมี Stock ลบไป
		const updatedProWholeProduct = product.productWholeSale.filter(
			(proWholeId) => proWholeId.toString() !== deletedProWhole.id.toString()
		);
		await Product.findByIdAndUpdate(product, {
			productWholeSale: updatedProWholeProduct
		});

		// return ค่า
		return deletedProWhole;
	},
//! Rank Distributor Model
		addRankDistributorModel: async (parent, args, {userId}, info) => {
		const {
			idShop,
			no,
			rank_name,
			discount,
			color,
			icon
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!rank_name ) throw new Error('Please provide all required fields.');
		
		// สร้าง Rank Dis Model ขึ้นมา
		const RankDisModelCreate = await RankDisModel.create({
			no: no, 
			rank_name: rank_name, 
			discount: discount, 
			color: color,
			shop: shopID,
			icon: icon
		});

		// เช็คว่าถ้า shop ไม่มีตาราง rank_distributors ให้ทำการสร้างและเพิ่ม
		if (!shopID.rank_distributors) {
			shopID.rank_distributors = [RankDisModelCreate];
		} else {
			shopID.rank_distributors.push(RankDisModelCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return RankDisModel.findById(RankDisModelCreate.id).populate(
			[
				{path: 'reward'},
				{path: 'condition'},
				{path: 'treatment'}
			]
		);
	},
	updateRankDistributorModel: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idRankDisMo,
			no,
			rank_name,
			discount,
			color,
			icon
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const RankDisMoID = await RankDisModel.findById(idRankDisMo)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข rank_distributors ใน Database
		await RankDisModel.findByIdAndUpdate(idRankDisMo, {
			no: !!no ? no : RankDisMoID.no,
			rank_name: !!rank_name ? rank_name : RankDisMoID.rank_name, 
			discount: !!discount ? discount : RankDisMoID.discount, 
			color: !!color ? color : RankDisMoID.color,
			icon: !!icon ? icon : RankDisMoID.icon
		});

		// ค้นหา rank_distributors ที่จะอัพเดต
		const updatedRankDisModel = await RankDisModel.findById(idRankDisMo).populate(
			[
				{path: 'reward'},
				{path: 'condition'},
				{path: 'treatment'}
			]
		);

		// return ค่า
		return updatedRankDisModel;
	},
	deleteRankDistributorModel: async (parent, args, { userId }, info) => {
		const { idRankDisMo, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and address shop ใน database
		const rankDisMoID = await RankDisModel.findById(idRankDisMo);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ rankDisMo
		const deletedRankDisMo = await RankDisModel.findByIdAndRemove(
			rankDisMoID
		).populate(
			[
				{path: 'reward'},
				{path: 'condition'},
				{path: 'treatment'}
			]
		);

		// อัพ shop.rank_distributors ใหม่เพราะมี shop ลบไป
		const updatedRankDisMo = shopID.rank_distributors.filter(
			(rankDisMoId) => rankDisMoId.toString() !== deletedRankDisMo.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			rank_distributors: updatedRankDisMo
		});

		// return ค่า
		return deletedRankDisMo;
	},
//! Rank Member Model
	addRankMemberModel: async (parent, args, {userId}, info) => {
		const {
			idShop,
			no,
			rank_name,
			reward,
			discount,
			condition,
			treatment
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!rank_name || !reward || !discount || !condition || !treatment) throw new Error('Please provide all required fields.');
		
		// สร้าง Rank Mem Model ขึ้นมา
		const RankMemModelCreate = await RankMemModel.create({
			no: no, 
			rank_name: rank_name, 
			reward: reward, 
			discount: discount, 
			condition: condition, 
			treatment: treatment,
			shop: shopID 
		});

		// เช็คว่าถ้า shop ไม่มีตาราง rank_members ให้ทำการสร้างและเพิ่ม
		if (!shopID.rank_members) {
			shopID.rank_members = [RankMemModelCreate];
		} else {
			shopID.rank_members.push(RankMemModelCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return RankMemModel.findById(RankMemModelCreate.id).populate({
			path: 'shop',
			populate: { path: 'rank_members' }
		});
	},
	updateRankMemberModel: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idRankMemMo,
			no,
			rank_name,
			reward,
			discount,
			condition,
			treatment
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const RankMemMoID = await RankMemModel.findById(idRankMemMo)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข rank_members ใน Database
		await RankMemModel.findByIdAndUpdate(idRankMemMo, {
			no: !!no ? no : RankMemMoID.no,
			rank_name: !!rank_name ? rank_name : RankMemMoID.rank_name, 
			reward: !!reward ? reward : RankMemMoID.reward, 
			discount: !!discount ? discount : RankMemMoID.discount, 
			condition: !!condition ? condition : RankMemMoID.condition, 
			treatment: !!treatment ? treatment : RankMemMoID.treatment
		});

		// ค้นหา rank_members ที่จะอัพเดต
		const updatedRankMemModel = await RankMemModel.findById(idRankMemMo).populate({
			path: 'shop',
			populate: { path: 'rank_members' }
		});

		// return ค่า
		return updatedRankMemModel;
	},
	deleteRankMemberModel: async (parent, args, { userId }, info) => {
		const { idRankMemMo, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and rank_members ใน database
		const rankMemMoID = await RankMemModel.findById(idRankMemMo);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ rankMemMo
		const deletedRankMemMo = await RankMemModel.findByIdAndRemove(
			rankMemMoID
		).populate({
			path: 'shop',
			populate: { path: 'rank_members' }
		});

		// อัพ shop.rank_members ใหม่เพราะมี shop ลบไป
		const updatedRankMemMo = shopID.rank_members.filter(
			(rankMemMoId) => rankMemMoId.toString() !== deletedRankMemMo.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			rank_members: updatedRankMemMo
		});

		// return ค่า
		return deletedRankMemMo;
	},
//! Rank Staff Model
	addRankStaffModel: async (parent, args, {userId}, info) => {
		const {
			idShop,
			no,
			rank_name,
			reward,
			discount,
			condition,
			treatment
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!rank_name || !reward || !discount || !condition || !treatment) throw new Error('Please provide all required fields.');
		
		// สร้าง Rank Mem Model ขึ้นมา
		const RankStaffModelCreate = await RankStaffModel.create({ 
			no: no,
			rank_name: rank_name, 
			reward: reward, 
			discount: discount, 
			condition: condition, 
			treatment: treatment,
			shop: shopID 
		});

		// เช็คว่าถ้า shop ไม่มีตาราง rank_staffs ให้ทำการสร้างและเพิ่ม
		if (!shopID.rank_staffs) {
			shopID.rank_staffs = [RankStaffModelCreate];
		} else {
			shopID.rank_staffs.push(RankStaffModelCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return RankStaffModel.findById(RankStaffModelCreate.id).populate({
			path: 'shop',
			populate: { path: 'rank_staffs' }
		});
	},
	updateRankStaffModel: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idRankStaffMo,
			no,
			rank_name,
			reward,
			discount,
			condition,
			treatment
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const RankStaffMoID = await RankStaffModel.findById(idRankStaffMo)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข rank_member_model ใน Database
		await RankStaffModel.findByIdAndUpdate(idRankStaffMo, {
			no: !!no ? no : RankStaffMoID.no,
			rank_name: !!rank_name ? rank_name : RankStaffMoID.rank_name, 
			reward: !!reward ? reward : RankStaffMoID.reward, 
			discount: !!discount ? discount : RankStaffMoID.discount, 
			condition: !!condition ? condition : RankStaffMoID.condition, 
			treatment: !!treatment ? treatment : RankStaffMoID.treatment
		});

		// ค้นหา rank_member_model ที่จะอัพเดต
		const updatedRankStaffModel = await RankStaffModel.findById(idRankStaffMo).populate({
			path: 'shop',
			populate: { path: 'rank_staffs' }
		});

		// return ค่า
		return updatedRankStaffModel;
	},
	deleteRankStaffModel: async (parent, args, { userId }, info) => {
		const { idRankStaffMo, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and rank_member_model ใน database
		const rankStaffMoID = await RankStaffModel.findById(idRankStaffMo);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ rankStaffMo
		const deletedRankStaffMo = await RankStaffModel.findByIdAndRemove(
			rankStaffMoID
		).populate({
			path: 'shop',
			populate: { path: 'rank_staffs' }
		});

		// อัพ shop.rank_staffs ใหม่เพราะมี shop ลบไป
		const updatedRankMemMo = shopID.rank_staffs.filter(
			(ranStaffMoId) => ranStaffMoId.toString() !== deletedRankStaffMo.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			rank_staffs: updatedRankMemMo
		});

		// return ค่า
		return deletedRankStaffMo;
	},
//! Reward Point Dis Model
	addRewardPointDistributorModel: async (parent, args, {userId}, info) => {
		const {
			idShop,
			condition,
			usePoint,
			reward
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!usePoint || !reward || !condition) throw new Error('Please provide all required fields.');
		
		// สร้าง Rank Mem Model ขึ้นมา
		const RewardPointDisModelCreate = await RewardPointDisModel.create({ 
			condition: condition, 
			reward: reward, 
			usePoint: usePoint,
			shop: shopID 
		});

		// เช็คว่าถ้า shop ไม่มีตาราง point_distributors ให้ทำการสร้างและเพิ่ม
		if (!shopID.point_distributors) {
			shopID.point_distributors = [RewardPointDisModelCreate];
		} else {
			shopID.point_distributors.push(RewardPointDisModelCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return RewardPointDisModel.findById(RewardPointDisModelCreate.id).populate({
			path: 'shop',
			populate: { path: 'point_distributors' }
		});
	},
	updateRewardPointDistributorModel: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idReward,
			reward,
			usePoint,
			condition
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const RewardPointDisMoID = await RewardPointDisModel.findById(idReward)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข point_distributors ใน Database
		await RewardPointDisModel.findByIdAndUpdate(idReward, {
			usePoint: !!usePoint ? usePoint : RewardPointDisMoID.usePoint, 
			reward: !!reward ? reward : RewardPointDisMoID.reward,
			condition: !!condition ? condition : RewardPointDisMoID.condition
		});

		// ค้นหา point_distributors ที่จะอัพเดต
		const updatedRewardPointDisModel = await RewardPointDisModel.findById(idReward).populate({
			path: 'shop',
			populate: { path: 'point_distributors' }
		});

		// return ค่า
		return updatedRewardPointDisModel;
	},
	deleteRewardPointDistributorModel: async (parent, args, { userId }, info) => {
		const { idReward, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and rank_member_model ใน database
		const rewardPointDisMoID = await RewardPointDisModel.findById(idReward);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ rewardPointDisMo
		const deletedRewardPointDisMo = await RewardPointDisModel.findByIdAndRemove(
			rewardPointDisMoID
		).populate({
			path: 'shop',
			populate: { path: 'point_distributors' }
		});

		// อัพ shop.point_distributors ใหม่เพราะมี shop ลบไป
		const updatedRewardPointDisMo = shopID.point_distributors.filter(
			(rewardPointDisMoId) => rewardPointDisMoId.toString() !== deletedRewardPointDisMo.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			point_distributors: updatedRewardPointDisMo
		});

		// return ค่า
		return deletedRewardPointDisMo;
	},
//! Reward Point Member Model
	addRewardPointMemberModel: async (parent, args, {userId}, info) => {
		const {
			idShop,
			condition,
			usePoint,
			reward
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!usePoint || !reward || !condition) throw new Error('Please provide all required fields.');
		
		// สร้าง Rank Mem Model ขึ้นมา
		const RewardPointMemModelCreate = await RewardPointMemModel.create({ 
			condition: condition, 
			reward: reward, 
			usePoint: usePoint,
			shop: shopID 
		});

		// เช็คว่าถ้า shop ไม่มีตาราง point_members ให้ทำการสร้างและเพิ่ม
		if (!shopID.point_members) {
			shopID.point_members = [RewardPointMemModelCreate];
		} else {
			shopID.point_members.push(RewardPointMemModelCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return RewardPointMemModel.findById(RewardPointMemModelCreate.id).populate({
			path: 'shop',
			populate: { path: 'point_members' }
		});
	},
	updateRewardPointMemberModel: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idReward,
			usePoint,
			reward,
			condition
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const RewardPointMemMoID = await RewardPointMemModel.findById(idReward)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข point_members ใน Database
		await RewardPointMemModel.findByIdAndUpdate(idReward, {
			usePoint: !!usePoint ? usePoint : RewardPointMemMoID.usePoint, 
			reward: !!reward ? reward : RewardPointMemMoID.reward,
			condition: !!condition ? condition : RewardPointMemMoID.condition
		});

		// ค้นหา point_members ที่จะอัพเดต
		const updatedRewardPointMemModel = await RewardPointMemModel.findById(idReward).populate({
			path: 'shop',
			populate: { path: 'point_members' }
		});

		// return ค่า
		return updatedRewardPointMemModel;
	},
	deleteRewardPointMemberModel: async (parent, args, { userId }, info) => {
		const { idReward, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and point_members ใน database
		const rewardPointMemMoID = await RewardPointMemModel.findById(idReward);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ rewardPointMemMo
		const deletedRewardPointMemMo = await RewardPointMemModel.findByIdAndRemove(
			rewardPointMemMoID
		).populate({
			path: 'shop',
			populate: { path: 'point_members' }
		});

		// อัพ shop.point_members ใหม่เพราะมี shop ลบไป
		const updatedRewardPointMemMo = shopID.point_members.filter(
			(rewardPointMemMoId) => rewardPointMemMoId.toString() !== deletedRewardPointMemMo.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			point_members: updatedRewardPointMemMo
		});

		// return ค่า
		return deletedRewardPointMemMo;
	},
//! Reward Point Staff Model
	addRewardPointStaffModel: async (parent, args, {userId}, info) => {
		const {
			idShop,
			condition,
			usePoint,
			reward
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!usePoint || !reward || !condition) throw new Error('Please provide all required fields.');
		
		// สร้าง Rank Staff Model ขึ้นมา
		const RewardPointStaffModelCreate = await RewardPointStaffModel.create({ 
			condition: condition, 
			reward: reward, 
			usePoint: usePoint,
			shop: shopID 
		});

		// เช็คว่าถ้า shop ไม่มีตาราง point_staffs ให้ทำการสร้างและเพิ่ม
		if (!shopID.point_staffs) {
			shopID.point_staffs = [RewardPointStaffModelCreate];
		} else {
			shopID.point_staffs.push(RewardPointStaffModelCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return RewardPointStaffModel.findById(RewardPointStaffModelCreate.id).populate({
			path: 'shop',
			populate: { path: 'point_staffs' }
		});
	},
	updateRewardPointStaffModel: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idReward,
			usePoint,
			reward,
			condition
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const RewardPointStaffMoID = await RewardPointStaffModel.findById(idReward)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข point_staffs ใน Database
		await RewardPointStaffModel.findByIdAndUpdate(idReward, {
			usePoint: !!usePoint ? usePoint : RewardPointStaffMoID.usePoint, 
			reward: !!reward ? reward : RewardPointStaffMoID.reward,
			condition: !!condition ? condition : RewardPointStaffMoID.condition
		});

		// ค้นหา point_staffs ที่จะอัพเดต
		const updatedRewardPointStaffModel = await RewardPointStaffModel.findById(idReward).populate({
			path: 'shop',
			populate: { path: 'point_staffs' }
		});

		// return ค่า
		return updatedRewardPointStaffModel;
	},
	deleteRewardPointStaffModel: async (parent, args, { userId }, info) => {
		const { idReward, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and point_staffs ใน database
		const rewardPointStaffMoID = await RewardPointStaffModel.findById(idReward);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ rewardPointMemMo
		const deletedRewardPointStaffMo = await RewardPointStaffModel.findByIdAndRemove(
			rewardPointStaffMoID
		).populate({
			path: 'shop',
			populate: { path: 'point_staffs' }
		});

		// อัพ shop.point_staffs ใหม่เพราะมี shop ลบไป
		const updatedRewardPointStaffMo = shopID.point_staffs.filter(
			(rewardPointStaffMoId) => rewardPointStaffMoId.toString() !== deletedRewardPointStaffMo.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			point_staffs: updatedRewardPointStaffMo
		});

		// return ค่า
		return deletedRewardPointStaffMo;
	},
//! Member Customer
	addMemberCustomer: async (parent, args, {userId}, info) => {
		const {
			idShop,
			idCus,
			idRankModel,
			discount,
			codeCustomer
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// ค้นหา shop
		const shopID = await Shop.findById(idShop)

		//เช็คว่า idCus คนนี้มีใน mem ของ shop นี้หรือไม่
		const currentMembers = await MemberCustomer.find({}).populate({path: 'data'})
		const isMemExits = currentMembers.findIndex((mem) => mem.data.id.toString() === idCus ) > -1
		if (isMemExits) throw new Error('Already has this member.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!discount || !codeCustomer) throw new Error('Please provide all required fields.');
		
		// สร้าง customer ขึ้นมา
		const CustomerCreate = await MemberCustomer.create({ 
			discount: discount, 
			codeCustomer: codeCustomer,
			data: idCus,
			shop: idShop,
			rank: idRankModel
		});

		// เช็คว่าถ้า shop ไม่มีตาราง memberCustomers ให้ทำการสร้างและเพิ่ม
		if (!shopID.memberCustomers) {
			shopID.memberCustomers = [CustomerCreate];
		} else {
			shopID.memberCustomers.push(CustomerCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return MemberCustomer.findById(CustomerCreate.id)
		.populate({
			path: 'shop'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'data'
		})
	},
	updateMemberCustomer: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idNewShop,
			idCus,
			idRankModel,
			discount,
			codeCustomer
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const CustomerID = await MemberCustomer.findById(idCus)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');
		
		// ทำการแก้ไข memberCustomers ใน Database
		await MemberCustomer.findByIdAndUpdate(idCus, {
			shop: !!idNewShop ? idNewShop : CustomerID.shop,
			rank: !!idRankModel ? idRankModel : CustomerID.rank,
			discount: !!discount ? discount : CustomerID.discount, 
			codeCustomer: !!codeCustomer ? codeCustomer : CustomerID.codeCustomer
		});

		// ค้นหา memberCustomers ที่จะอัพเดต
		const updatedMemberCustomer = await MemberCustomer.findById(idCus)
		.populate({
			path: 'shop'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'data'
		})

		// return ค่า
		return updatedMemberCustomer;
	},
	deleteMemberCustomer: async (parent, args, { userId }, info) => {
		const { idCus, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and reward_point_staff_model ใน database
		const memberCustomerID = await MemberCustomer.findById(idCus);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ memberCustomers
		const deletedCustomerMember = await MemberCustomer.findByIdAndRemove(
			memberCustomerID
		).populate({
			path: 'shop'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'data'
		})

		// อัพ shop.memberCustomers ใหม่เพราะมี shop ลบไป
		const updatedMemberCustomer = shopID.memberCustomers.filter(
			(memberCustomerId) => memberCustomerId.toString() !== deletedCustomerMember.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			memberCustomers: updatedMemberCustomer
		});

		// return ค่า
		return deletedCustomerMember;
	},
//! Distributor
	addDistributor: async (parent, args, {userId}, info) => {
		const {
			idShop,
			idDis,
			idSupervisor,
			idRankModel,
			discount,
			codeDistributor
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idShop || !idRankModel || !idDis || !idSupervisor || !discount || !codeDistributor) throw new Error('Please provide all required fields.');

		// ค้นหา shop data(ข้อมูลตัวแทน) supervisor(ข้อมูลหัวข่าย)
		const shopID = await Shop.findById(idShop)
		const dataID = await User.findById(idDis)
		const supervisorID = await User.findById(idSupervisor)
		const rankModelID = await RankDisModel.findById(idRankModel)
		
		//เช็คว่า idDis คนนี้มีใน dis ของ shop นี้หรือไม่
		const currentDises = await Distributor.find({}).populate({path: 'data'})
		const isDisExits = currentDises.findIndex((dis) => dis.data.id.toString() === idDis ) > -1
		if (isDisExits) throw new Error('Already has this distributor.');

		// สร้าง distributor ขึ้นมา
		const DistributorCreate = await Distributor.create({ 
			rank: rankModelID,
			discount: discount, 
			codeDistributor: codeDistributor,
			data: dataID,
			supervisor: supervisorID,
			shop: idShop
		});

		// เช็คว่าถ้า shop ไม่มีตาราง distributors ให้ทำการสร้างและเพิ่ม
		if (!shopID.distributors) {
			shopID.distributors = [DistributorCreate];
		} else {
			shopID.distributors.push(DistributorCreate);
		}

		// save ข้อมูล shop
		await shopID.save();

		// return ค่า
		return Distributor.findById(DistributorCreate.id)
		.populate({
			path: 'shop'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'data'
		})
		.populate({
			path: 'supervisor'
		})
	},
	updateDistributor: async (parent, args, { userId }, info) => {
		const {
			idShop,
			idDis,
			idSupervisor,
			idNewSuper,
			idNewShop,
			idRankModel,
			discount,
			codeDistributor
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idShop || !idRankModel || !idDis || !idSupervisor ) throw new Error('Please provide all required fields.');

		// หา Shop ใน Database
		const shopID = await Shop.findById(idShop);
		const DisID = await Distributor.findById(idDis)
		const supervisorID = await User.findById(idSupervisor)
		const rankMedelID = await RankDisModel.findById(idRankModel)

		// เช็คว่ามี Shop ID ที่จะแก้ไขหรือไม่
		if (!idShop) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Shop นี้เป็นของ user ที่ขอแก้ไขหรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You are not authorized.');
		
		
		// ทำการแก้ไข distributors ใน Database
		await Distributor.findByIdAndUpdate(idDis, {
			shop: !!idNewShop ? idNewShop : DisID.shop,
			rank: !!rankMedelID ? rankMedelID : DisID.rank, 
			discount: !!discount ? discount : DisID.discount,
			codeDistributor: !!codeDistributor ? codeDistributor : DisID.codeDistributor,
			supervisor: !!idNewSuper ? idNewSuper : DisID.supervisor
		});

		// ค้นหา distributors ที่จะอัพเดต
		const updatedDis = await Distributor.findById(idDis)
		.populate({
			path: 'shop'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'data'
		})
		.populate({
			path: 'supervisor'
		})

		// return ค่า
		return updatedDis;
	},
	deleteDistributor: async (parent, args, { userId }, info) => {
		const { idDis, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and reward_point_staff_model ใน database
		const distributorID = await Distributor.findById(idDis);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ distributors
		const deletedDistributor = await Distributor.findByIdAndRemove(
			distributorID
		).populate({
			path: 'shop'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'data'
		})
		.populate({
			path: 'supervisor'
		})

		// อัพ shop.distributors ใหม่เพราะมี shop ลบไป
		const updatedDistriibutor = shopID.distributors.filter(
			(disId) => disId.toString() !== deletedDistributor.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			distributors: updatedDistriibutor
		});

		// return ค่า
		return deletedDistributor;
	},
//! Staff
	addStaff: async (parent, args, {userId}, info) => {
		const {
			idStaff,
			idRankModel,
			idBranch,
			wages,
			employmentPattern,
			discount,
			codeStaff
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if ( !idRankModel || !wages || !employmentPattern || !idStaff || !idBranch || !codeStaff) throw new Error('Please provide all required fields.');

		//เช็คว่า idCus คนนี้มีใน cus ของ shop นี้หรือไม่
		const currentCuses = await MemberCustomer.find({}).populate({path: 'data'})
		const isMemExits = currentCuses.findIndex((cus) => cus.data.id.toString() === idStaff ) > -1
		if (isMemExits) throw new Error('Already has this Staff.');

		// ค้นหา shop data(ข้อมูลตัวแทน) rank branch
		const dataID = await User.findById(idStaff)
		const rankModelID = await RankDisModel.findById(idRankModel)
		const branchID = await Shop.findById(idBranch)
		
		// สร้าง staffs ขึ้นมา
		const StaffCreate = await Staff.create({ 
			rank: idRankModel,
			wages: wages,
			employmentPattern: employmentPattern,
			discount: discount, 
			codeStaff: codeStaff,
			data: idStaff,
			branch: branchID
		});

		// เช็คว่าถ้า shop ไม่มีตาราง staffs ให้ทำการสร้างและเพิ่ม
		if (!branchID.staffs) {
			branchID.staffs = [StaffCreate];
		} else {
			branchID.staffs.push(StaffCreate);
		}

		// save ข้อมูล shop
		await branchID.save();

		// return ค่า
		return Staff.findById(StaffCreate.id)
		.populate({
			path: 'branch'
		})
		.populate({
			path: 'rank'
		})
		.populate({
			path: 'workSchedules',
			populate: {path: 'rank'}
		})
		.populate({
			path: 'workSchedules',
			populate: {path: 'user'}
		})
		.populate({
			path: 'point'
		})
		.populate({
			path: 'reward'
		})
		.populate({
			path: 'data'
		})
	},
	updateStaff: async (parent, args, { userId }, info) => {
		const {
			idStaff,
			idRankModel,
			idBranch,
			wages,
			employmentPattern,
			discount,
			codeStaff
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop data(ข้อมูลตัวแทน) rank branch
		const staffID = await User.findById(idStaff)
		const rankModelID = await RankDisModel.findById(idRankModel)
		const branchID = await Shop.findById(idBranch)

		// ทำการแก้ไข staffs ใน Database
		await Staff.findByIdAndUpdate(idStaff, {
			rank: !!idRankModel ? idRankModel : staffID.rank,
			wages: !!wages ? wages : staffID.wages,
			employmentPattern: !!employmentPattern ? employmentPattern : staffID.employmentPattern,
			discount: !!discount ? discount : staffID.discount, 
			codeStaff: !!codeStaff ? codeStaff : staffID.codeStaff,
			branch: !!branchID ? branchID : staffID.branch
		});

		// ค้นหา staffs ที่จะอัพเดต
		const updatedStaff = await Staff.findById(idStaff)
		.populate([
			{
				path: 'branch',
				populate: { path: 'staffs' }
			},
			{path: 'rank'},
			{path: 'data'},
			{path: 'point'},
			{path: 'reward'},
			{
				path: 'workSchedules',
				populate: [{path: 'rank'},{path: 'user'}]
			}
		]);

		// return ค่า
		return updatedStaff;
	},
	deleteStaff: async (parent, args, { userId }, info) => {
		const { idStaff, idShop } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา shop and reward_point_staff_model ใน database
		const staffID = await Staff.findById(idStaff);
		const shopID = await Shop.findById(idShop)

		// เช็คว่า user เป็นเจ้าของ shop หรือไม่
		if (userId !== shopID.owner.toString())
			throw new Error('You not authorized.');

		// ลบ staffs
		const deletedStaff = await Staff.findByIdAndRemove(
			staffID
		).populate({
			path: 'shop',
			populate: { path: 'staffs' }
		});

		// อัพ shop.staffs ใหม่เพราะมี shop ลบไป
		const updatedStaff = shopID.staffs.filter(
			(staffId) => staffId.toString() !== deletedStaff.id.toString()
		);
		await Shop.findByIdAndUpdate(shopID, {
			staffs: updatedStaff
		});

		// return ค่า
		return deletedStaff;
	},
//! Work Schedule
	addWorkSchedule: async (parent, args, {userId}, info) => {
		const {
			idStaff,
			idRankModel,
			wages,
			employmentPattern
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idStaff || !idRankModel || !wages || !employmentPattern ) throw new Error('Please provide all required fields.');

		// ค้นหา shop data(ข้อมูลตัวแทน) rank branch
		const StaffID = await Staff.findById(idStaff)
		const rankModelID = await RankDisModel.findById(idRankModel)
		
		// สร้าง staffs ขึ้นมา
		const WorkScheCreate = await WorkSchedule.create({ 
			rank: idRankModel,
			wages: wages,
			employmentPattern: employmentPattern,
			totalWagesToDay: 0,
			user: StaffID.data
		});

		// เช็คว่าถ้า shop ไม่มีตาราง staffs ให้ทำการสร้างและเพิ่ม
		if (!StaffID.workSchedules) {
			StaffID.workSchedules = [WorkScheCreate];
		} else {
			StaffID.workSchedules.push(WorkScheCreate);
		}

		// save ข้อมูล shop
		await StaffID.save();

		// return ค่า
		return WorkSchedule.findById(WorkScheCreate.id)
		.populate([{path: 'rank'},{path: 'user'}])
	},
	updateWorkSchedule: async (parent, args, { userId }, info) => {
		const {
			idWorkSchedule,
			idRankModel,
			wages,
			checkOut,
			employmentPattern,
			totalWagesToDay
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idWorkSchedule) throw new Error('Please provide all required fields.');

		// ค้นหา shop data(ข้อมูลตัวแทน) rank branch
		const rankModelID = await RankDisModel.findById(idRankModel)
		const workScheduleID = await WorkSchedule.findById(idWorkSchedule)

		// ทำการแก้ไข staffs ใน Database
		await WorkSchedule.findByIdAndUpdate(idWorkSchedule, {
			rank: !!idRankModel ? idRankModel : workScheduleID.rank,
			wages: !!wages ? wages : workScheduleID.wages,
			checkOut: !!checkOut ? checkOut : workScheduleID.checkOut,
			employmentPattern: !!employmentPattern ? employmentPattern : workScheduleID.employmentPattern,
			totalWagesToDay: !!totalWagesToDay ? totalWagesToDay : workScheduleID.totalWagesToDay
		});

		// ค้นหา staffs ที่จะอัพเดต
		const updatedWorkSche = await WorkSchedule.findById(idWorkSchedule)
		.populate([{path: 'rank'},{path: 'user'}])

		// return ค่า
		return updatedWorkSche;
	},
	deleteWorkSchedule: async (parent, args, { userId }, info) => {
		const { idStaff, idWorkSchedule } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idWorkSchedule || !idStaff) throw new Error('Please provide all required fields.');

		// ค้นหา shop and reward_point_staff_model ใน database
		const staffID = await Staff.findById(idStaff);
		const workScheduleID = await WorkSchedule.findById(idWorkSchedule)

		// ลบ staffs
		const deletedWorkSche = await WorkSchedule.findByIdAndRemove(
			workScheduleID
		).populate([{path: 'rank'},{path: 'user'}])

		// อัพ shop.staffs ใหม่เพราะมี shop ลบไป
		const updatedWorkSche = staffID.workSchedules.filter(
			(workScheduleId) => workScheduleId.toString() !== deletedWorkSche.id.toString()
		);
		await Staff.findByIdAndUpdate(staffID, {
			workSchedules: updatedWorkSche
		});

		// return ค่า
		return deletedWorkSche;
	},
//! Point Member
	addPointMember: async (parent, args, {userId}, info) => {
		const {
			idMember,
			addPoint,
			delPoint,
			description
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idMember || !addPoint || !description) throw new Error('Please provide all required fields.');

		// ค้นหา member
		const memberID = await MemberCustomer.findById(idMember).populate({path: 'data'})

		// สร้าง point ขึ้นมา
		const PointCreate = await PointMember.create({ 
			addPoint: !addPoint ? addPoint : 0,
			delPoint: !delPoint ? delPoint : 0,
			description: description,
			memberCustomer: memberID.data
		});

		// เช็คว่าถ้า memberCustomer ไม่มีตาราง point ให้ทำการสร้างและเพิ่ม
		if (!memberID.point) {
			memberID.point = [PointCreate];
		} else {
			memberID.point.push(PointCreate);
		}

		// save ข้อมูล memberCustomer
		await memberID.save();

		// return ค่า
		return PointMember.findById(PointCreate.id)
		.populate({
			path: 'memberCustomer',
			populate: { path: 'point' }
		});
	},
	updatePointMember: async (parent, args, { userId }, info) => {
		const {
			idMember,
			idPoint,
			addPoint,
			delPoint,
			description
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา memberCustomer data(ข้อมูลตัวแทน) rank branch
		const memberID = await MemberCustomer.findById(idMember)
		const pointID = await PointMember.findById(idPoint)

		// เช็คว่ามี Point ID ที่จะแก้ไขหรือไม่
		if (!idPoint) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Point นี้เป็นของ member ที่ขอแก้ไขหรือไม่
		if (pointID.memberCustomer.toString() !== memberID.data.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข point ใน Database
		await PointMember.findByIdAndUpdate(idPoint, {
			addPoint: !!addPoint ? addPoint : pointID.addPoint, 
			delPoint: !!delPoint ? delPoint : pointID.delPoint,
			description: !!description ? description: pointID.description
		});

		// ค้นหา point ที่จะอัพเดต
		const updatedPoint = await PointMember.findById(idPoint).populate({
			path: 'memberCustomer',
			populate: { path: 'point' }
		});

		// return ค่า
		return updatedPoint;
	},
	deletePointMember: async (parent, args, { userId }, info) => {
		const { idPoint, idMember } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา memberCustomer and reward_point_staff_model ใน database
		const pointID = await PointMember.findById(idPoint);
		const memberID = await MemberCustomer.findById(idMember)

		// ลบ point
		const deletedPoint = await PointMember.findByIdAndRemove(
			pointID
		).populate({
			path: 'memberCustomer',
			populate: { path: 'point' }
		});

		// อัพ memberCustomer.point ใหม่เพราะมี memberCustomer ลบไป
		const updatedPoint = memberID.point.filter(
			(pointId) => pointId.toString() !== deletedPoint.id.toString()
		);
		await MemberCustomer.findByIdAndUpdate(memberID, {
			point: updatedPoint
		});

		// return ค่า
		return deletedPoint;
	},
//! Point Distributor
	addPointDistributor: async (parent, args, {userId}, info) => {
		const {
			idDis,
			addPoint,
			delPoint,
			description
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idDis || !description) throw new Error('Please provide all required fields.');

		// ค้นหา distributpr
		const disID = await Distributor.findById(idDis)
		
		// สร้าง point ขึ้นมา
		const PointCreate = await PointDis.create({ 
			addPoint: !addPoint ? addPoint : 0,
			delPoint: !delPoint ? delPoint : 0,
			distributor: disID.data,
			description: description
		});

		// เช็คว่าถ้า distributor ไม่มีตาราง point ให้ทำการสร้างและเพิ่ม
		if (!disID.point) {
			disID.point = [PointCreate];
		} else {
			disID.point.push(PointCreate);
		}

		// save ข้อมูล distributor
		await disID.save();

		// return ค่า
		return PointDis.findById(PointCreate.id).populate({
			path: 'distributor',
			populate: { path: 'point' }
		});
	},
	updatePointDistributor: async (parent, args, { userId }, info) => {
		const {
			idDis,
			idPoint,
			addPoint,
			delPoint,
			description
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา distributor data(ข้อมูลตัวแทน) rank branch
		const disID = await Distributor.findById(idDis)
		const pointID = await PointDis.findById(idPoint)

		// เช็คว่ามี Point ID ที่จะแก้ไขหรือไม่
		if (!idPoint) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Point นี้เป็นของ distributpr ที่ขอแก้ไขหรือไม่
		if (pointID.distributor.toString() !== disID.data.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข point ใน Database
		await PointDis.findByIdAndUpdate(idPoint, {
			addPoint: !!addPoint ? addPoint : pointID.addPoint, 
			delPoint: !!delPoint ? delPoint : pointID.delPoint,
			description: !!description ? description : pointID.description
		});

		// ค้นหา point ที่จะอัพเดต
		const updatedPoint = await PointDis.findById(idPoint).populate({
			path: 'distributor',
			populate: { path: 'point' }
		});

		// return ค่า
		return updatedPoint;
	},
	deletePointDistributor: async (parent, args, { userId }, info) => {
		const { idPoint, idDis } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา distributor and reward_point_staff_model ใน database
		const pointID = await PointDis.findById(idPoint);
		const disID = await Distributor.findById(idDis)

		// ลบ point
		const deletedPoint = await PointDis.findByIdAndRemove(
			pointID
		).populate({
			path: 'distributor',
			populate: { path: 'point' }
		});

		// อัพ distributor.point ใหม่เพราะมี distributor ลบไป
		const updatedPoint = disID.point.filter(
			(pointId) => pointId.toString() !== deletedPoint.id.toString()
		);
		await Distributor.findByIdAndUpdate(disID, {
			point: updatedPoint
		});

		// return ค่า
		return deletedPoint;
	},
//! Point Staff
	addPointStaff: async (parent, args, {userId}, info) => {
		const {
			idStaff,
			addPoint,
			delPoint,
			description
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idStaff || !description) throw new Error('Please provide all required fields.');

		// ค้นหา distributpr
		const staffID = await Staff.findById(idStaff)
		
		// สร้าง point ขึ้นมา
		const PointCreate = await PointStaff.create({ 
			addPoint: !addPoint ? addPoint : 0,
			delPoint: !delPoint ? delPoint : 0,
			staff: staffID.data,
			description: description
		});

		// เช็คว่าถ้า staff ไม่มีตาราง point ให้ทำการสร้างและเพิ่ม
		if (!staffID.point) {
			staffID.point = [PointCreate];
		} else {
			staffID.point.push(PointCreate);
		}

		// save ข้อมูล staff
		await staffID.save();

		// return ค่า
		return PointStaff.findById(PointCreate.id).populate({
			path: 'staff',
			populate: { path: 'point' }
		});
	},
	updatePointStaff: async (parent, args, { userId }, info) => {
		const {
			idStaff,
			idPoint,
			addPoint,
			delPoint,
			description
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา staff data(ข้อมูลตัวแทน) rank branch
		const staffID = await Staff.findById(idStaff)
		const pointID = await PointStaff.findById(idPoint)

		// เช็คว่ามี Point ID ที่จะแก้ไขหรือไม่
		if (!idPoint) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Point นี้เป็นของ distributpr ที่ขอแก้ไขหรือไม่
		if (pointID.staff.toString() !== staffID.data.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข point ใน Database
		await PointStaff.findByIdAndUpdate(idPoint, {
			addPoint: !!addPoint ? addPoint : pointID.addPoint, 
			delPoint: !!delPoint ? delPoint : pointID.delPoint,
			description: !!description ? description : pointID.description
		});

		// ค้นหา point ที่จะอัพเดต
		const updatedPoint = await PointStaff.findById(idPoint).populate({
			path: 'staff',
			populate: { path: 'point' }
		});

		// return ค่า
		return updatedPoint;
	},
	deletePointStaff: async (parent, args, { userId }, info) => {
		const { idPoint, idStaff } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา staff and reward_point_staff_model ใน database
		const pointID = await PointStaff.findById(idPoint);
		const staffID = await Staff.findById(idStaff)

		// เช็คว่า user เป็นเจ้าของ staff หรือไม่
		if (userId !== staffID.data.toString())
			throw new Error('You not authorized.');

		// ลบ point
		const deletedPoint = await PointStaff.findByIdAndRemove(
			pointID
		).populate({
			path: 'staff',
			populate: { path: 'point' }
		});

		// อัพ staff.point ใหม่เพราะมี staff ลบไป
		const updatedPoint = staffID.point.filter(
			(pointId) => pointId.toString() !== deletedPoint.id.toString()
		);
		await Staff.findByIdAndUpdate(staffID, {
			point: updatedPoint
		});

		// return ค่า
		return deletedPoint;
	},
//! Reward Member
	addRewardMember: async (parent, args, {userId}, info) => {
		const {
			idMem,
			idRewardPointModel,
			idRewardRankModel,
			addPoint,
			delPoint
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if ( !idMem ) throw new Error('Please provide all required fields.');

		if (idRewardPointModel && idRewardRankModel) throw new Error('Please enter one field.');

		// ค้นหา member
		const memberID = await MemberCustomer.findById(idMem)

		// สร้าง reward ขึ้นมา
		const RewardCreate = await RewardMember.create({ 
			rewardPoint: idRewardPointModel,
			rewardRank: idRewardRankModel,
			addPoint: !!addPoint ? addPoint : 0,
			delPoint: !!delPoint ? delPoint : 0,
			memberCustomer: memberID.data
		})


		// เช็คว่าถ้า memberCustomer ไม่มีตาราง reward ให้ทำการสร้างและเพิ่ม
		if (!memberID.reward) {
			memberID.reward = [RewardCreate];
		} else {
			memberID.reward.push(RewardCreate);
		}

		// save ข้อมูล memberCustomer
		await memberID.save();

		// return ค่า
		return RewardMember.findById(RewardCreate.id)
		.populate(
			[
				{
					path: 'memberCustomer',
					populate: { path: 'reward' }
				},
				{ path: 'rewardPoint' },
				{ path: 'rewardRank' }
			]
		);
	},
	updateRewardMember: async (parent, args, { userId }, info) => {
		const {
			idMem,
			idReward,
			idRewardPointModel,
			idRewardRankModel,
			addPoint,
			delPoint
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา memberCustomer data(ข้อมูลตัวแทน) rank branch
		const memberID = await MemberCustomer.findById(idMem)
		const rewardID = await RewardMember.findById(idReward)

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if ( !idMem || !idReward ) throw new Error('Please provide all required fields.');

		// เช็คว่ามี Point ID ที่จะแก้ไขหรือไม่
		if (!idReward) throw new Error('There are not product IDs metioned.');

		// เช็คว่า Point นี้เป็นของ member ที่ขอแก้ไขหรือไม่
		if (rewardID.memberCustomer.toString() !== memberID.data.toString())
			throw new Error('You are not authorized.');
		
		// ทำการแก้ไข reward ใน Database
		await RewardMember.findByIdAndUpdate(idReward, {
			rewardPoint: !!idRewardPointModel || idRewardPointModel===null  ? idRewardPointModel : rewardID.rewardPoint,
			rewardRank: !!idRewardRankModel || idRewardRankModel===null ? idRewardRankModel : rewardID.rewardRank,
			addPoint: !!addPoint || addPoint===0 ? addPoint : rewardID.addPoint, 
			delPoint: !!delPoint || delPoint===0 ? delPoint : rewardID.delPoint
		});

		// ค้นหา reward ที่จะอัพเดต
		const updatedReward = await RewardMember.findById(idReward)
		.populate(
			[
				{
					path: 'memberCustomer',
					populate: { path: 'reward' }
				},
				{ path: 'rewardPoint' },
				{ path: 'rewardRank' }
			]
		);

		// return ค่า
		return updatedReward;
	},
	deleteRewardMember: async (parent, args, { userId }, info) => {
		const { idReward, idMem } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา memberCustomer and reward_point_staff_model ใน database
		const rewardID = await RewardMember.findById(idReward);
		const memberID = await MemberCustomer.findById(idMem)

		// ลบ reward
		const deletedReward = await RewardMember.findByIdAndRemove(
			rewardID
		).populate(
			[
				{
					path: 'memberCustomer',
					populate: { path: 'reward' }
				},
				{ path: 'rewardPoint' },
				{ path: 'rewardRank' }
			]
		);

		// อัพ memberCustomer.reward ใหม่เพราะมี memberCustomer ลบไป
		const updatedReward = memberID.reward.filter(
			(rewardId) => rewardId.toString() !== deletedReward.id.toString()
		);
		await MemberCustomer.findByIdAndUpdate(memberID, {
			reward: updatedReward
		});

		// return ค่า
		return deletedReward;
	},
//! Reward Distributor
	addRewardDistributor: async (parent, args, {userId}, info) => {
		const {
			idDis,
			idRewardPointModel,
			idRewardRankModel,
			addPoint,
			delPoint
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idDis) throw new Error('Please provide all required fields.');

		if (idRewardPointModel && idRewardRankModel) throw new Error('Please enter one field.');

		// ค้นหา distributor
		const disID = await Distributor.findById(idDis)
		
		// สร้าง reward ขึ้นมา
		const RewardCreate = await RewardDis.create({ 
			rewardPoint: idRewardPointModel,
			rewardRank: idRewardRankModel,
			addPoint: !!addPoint ? addPoint : 0,
			delPoint: !!delPoint ? delPoint : 0,
			distributor: disID.data
		});

		// เช็คว่าถ้า distributor ไม่มีตาราง reward ให้ทำการสร้างและเพิ่ม
		if (!disID.reward) {
			disID.reward = [RewardCreate];
		} else {
			disID.reward.push(RewardCreate);
		}

		// save ข้อมูล distributor
		await disID.save();

		// return ค่า
		return RewardDis.findById(RewardCreate.id)
		.populate(
			[
				{
					path: 'distributor',
					populate: { path: 'reward' }
				},
				{ path: 'rewardPoint' },
				{ path: 'rewardRank' }
			]
		);
	},
	updateRewardDistributor: async (parent, args, { userId }, info) => {
		const {
			idDis,
			idReward,
			idRewardPointModel,
			idRewardRankModel,
			addPoint,
			delPoint
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา distributor data(ข้อมูลตัวแทน) rank branch
		const disID = await Distributor.findById(idDis)
		const rewardID = await RewardDis.findById(idReward)

		// เช็คว่ามี Point ID ที่จะแก้ไขหรือไม่
		if (!idReward) throw new Error('There are not product IDs metioned.');

		// ทำการแก้ไข reward ใน Database
		await RewardDis.findByIdAndUpdate(idReward, {
			rewardPoint: !!idRewardPointModel || idRewardPointModel===null  ? idRewardPointModel : rewardID.rewardPoint,
			rewardRank: !!idRewardRankModel || idRewardRankModel===null ? idRewardRankModel : rewardID.rewardRank,
			addPoint: !!addPoint || addPoint===0 ? addPoint : rewardID.addPoint, 
			delPoint: !!delPoint || delPoint===0 ? delPoint : rewardID.delPoint
		});

		// ค้นหา reward ที่จะอัพเดต
		const updatedReward = await RewardDis.findById(idReward)
		.populate(
			[
				{
					path: 'distributor',
					populate: { path: 'reward' }
				},
				{ path: 'rewardPoint' },
				{ path: 'rewardRank' }
			]
		);

		// return ค่า
		return updatedReward;
	},
	deleteRewardDistributor: async (parent, args, { userId }, info) => {
		const { idReward, idDis } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา distributor and reward_point_staff_model ใน database
		const rewardID = await RewardDis.findById(idReward);
		const disID = await Distributor.findById(idDis)

		// ลบ reward
		const deletedReward = await RewardDis.findByIdAndRemove(
			rewardID
		).populate(
			[
				{
					path: 'distributor',
					populate: { path: 'reward' }
				},
				{ path: 'rewardPoint' },
				{ path: 'rewardRank' }
			]
		);

		// อัพ distributor.reward ใหม่เพราะมี distributor ลบไป
		const updatedReward = disID.reward.filter(
			(rewardId) => rewardId.toString() !== deletedReward.id.toString()
		);
		await Distributor.findByIdAndUpdate(disID, {
			reward: updatedReward
		});

		// return ค่า
		return deletedReward;
	},
//! Reward Staff
	addRewardStaff: async (parent, args, {userId}, info) => {
		const {
			idStaff,
			addPoint,
			delPoint
		} = args

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idStaff || !addPoint || !delPoint ) throw new Error('Please provide all required fields.');

		// ค้นหา staff
		const staffID = await Staff.findById(idStaff)
		
		// สร้าง reward ขึ้นมา
		const RewardCreate = await RewardStaff.create({ 
			addPoint: addPoint,
			delPoint: delPoint,
			staff: staffID
		});

		// เช็คว่าถ้า staff ไม่มีตาราง reward ให้ทำการสร้างและเพิ่ม
		if (!staffID.reward) {
			staffID.reward = [RewardCreate];
		} else {
			staffID.reward.push(RewardCreate);
		}

		// save ข้อมูล staff
		await staffID.save();

		// return ค่า
		return RewardStaff.findById(RewardCreate.id).populate({
			path: 'staff',
			populate: { path: 'reward' }
		});
	},
	updateRewardStaff: async (parent, args, { userId }, info) => {
		const {
			idStaff,
			idReward,
			addPoint,
			delPoint
		} = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา staff data(ข้อมูลตัวแทน) rank branch
		const staffID = await Staff.findById(idStaff)
		const rewardID = await RewardStaff.findById(idReward)

		// เช็คว่ามี reward ID ที่จะแก้ไขหรือไม่
		if (!idReward) throw new Error('There are not product IDs metioned.');

		// เช็คว่า reward นี้เป็นของ staff ที่ขอแก้ไขหรือไม่
		if (rewardID.staff.toString() !== staffID.data.toString())
			throw new Error('You are not authorized.');

		// ทำการแก้ไข reward ใน Database
		await RewardStaff.findByIdAndUpdate(idReward, {
			addPoint: !!addPoint ? addPoint : rewardID.addPoint, 
			delPoint: !!delPoint ? delPoint : rewardID.delPoint
		});

		// ค้นหา reward ที่จะอัพเดต
		const updatedReward = await RewardStaff.findById(idReward).populate({
			path: 'staff',
			populate: { path: 'reward' }
		});

		// return ค่า
		return updatedReward;
	},
	deleteRewardStaff: async (parent, args, { userId }, info) => {
		const { idReward, idStaff } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา staff and reward_point_staff_model ใน database
		const rewardID = await RewardStaff.findById(idReward);
		const staffID = await Staff.findById(idStaff)

		// เช็คว่า user เป็นเจ้าของ staff หรือไม่
		if (userId !== staffID.data.toString())
			throw new Error('You not authorized.');

		// ลบ reward
		const deletedReward = await RewardStaff.findByIdAndRemove(
			rewardID
		).populate({
			path: 'staff',
			populate: { path: 'reward' }
		});

		// อัพ staff.reward ใหม่เพราะมี staff ลบไป
		const updatedReward = staffID.reward.filter(
			(rewardId) => rewardId.toString() !== deletedReward.id.toString()
		);
		await Staff.findByIdAndUpdate(staffID, {
			reward: updatedReward
		});

		// return ค่า
		return deletedReward;
	},
//! Reward Rank Distributor Model
	addRewardRankDisModel: async (parent, args, { userId }, info) => {
		const { idRank, reward, img } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idRank || !reward) throw new Error('Please provide all required fields.');

		// สร้าง RewardRankDisModel ขึ้นมา
		const ReRankDisMoCreate = await ReRankDisModel.create({ ...args });

		// เช็คว่าถ้า RankDisModel ไม่มีตาราง reward ให้ทำการสร้างและเพิ่ม
		if (!RankDisMoID.reward) {
			RankDisMoID.reward = [ReRankDisMoCreate];
		} else {
			RankDisMoID.reward.push(ReRankDisMoCreate);
		}

		// save ข้อมูล product
		await RankDisMoID.save();

		// return ค่า
		return ReRankDisModel.findById(ReRankDisMoCreate.id)
	},
	updateRewardRankDisModel: async (parent, args, { userId }, info) => {
		const { idRank, idReRank, reward, img } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);
		const ReRankDisMoID = await ReRankDisModel.findById(idReRank)

		// เช็คว่ามี RewardRankDisModel ที่จะแก้ไขหรือไม่
		if (!ReRankDisMoID) throw new Error('There are not product IDs metioned.');

		// ทำการแก้ไข Reward ใน Database
		await ReRankDisModel.findByIdAndUpdate(idReRank, {
			reward: !!reward ? reward : ReRankDisMoID.reward,
			img: !!img ? img : ReRankDisMoID.img
		});

		// ค้นหา RewardRankDisModel ที่จะอัพเดต
		const updatedReRankDisModel = await ReRankDisModel.findById(idReRank)

		// return ค่า
		return updatedReRankDisModel;
	},
	deleteRewardRankDisModel: async (parent, args, { userId }, info) => {
		const { idReRank, idRank } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);
		const ReRankDisMoID = await ReRankDisModel.findById(idReRank)

		// // เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		// if (userId !== proTypeId.product.user.toString())
		// 	throw new Error('You not authorized.');

		// ลบ ReRankDisModel
		const deletedReRankDisModel = await ReRankDisModel.findByIdAndRemove(
			idReRank
		)

		// อัพ rankDisModel.reward ใหม่เพราะมี reward ลบไป
		const updatedRankDisModel = RankDisMoID.reward.filter(
			(rewardId) => rewardId.toString() !== deletedReRankDisModel.id.toString()
		);
		await RankDisModel.findByIdAndUpdate(idRank, {
			reward: updatedRankDisModel
		});

		// return ค่า
		return deletedReRankDisModel;
	},
//! Condition Rank Distributor Model
	addConditionRankDisModel: async (parent, args, { userId }, info) => {
		const { idRank, condition, img } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idRank || !condition) throw new Error('Please provide all required fields.');

		// สร้าง ConditionRankDisModel ขึ้นมา
		const ConRankDisMoCreate = await ConRankDisModel.create({ ...args });

		// เช็คว่าถ้า RankDisModel ไม่มีตาราง condition ให้ทำการสร้างและเพิ่ม
		if (!RankDisMoID.condition) {
			RankDisMoID.condition = [ConRankDisMoCreate];
		} else {
			RankDisMoID.condition.push(ConRankDisMoCreate);
		}

		// save ข้อมูล product
		await RankDisMoID.save();

		// return ค่า
		return ConRankDisModel.findById(ConRankDisMoCreate.id)
	},
	updateConditionRankDisModel: async (parent, args, { userId }, info) => {
		const { idRank, idConRank, condition, img } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);
		const ConRankDisMoID = await ConRankDisModel.findById(idConRank)

		// เช็คว่ามี ConditoinRankDisModel ที่จะแก้ไขหรือไม่
		if (!ConRankDisMoID) throw new Error('There are not product IDs metioned.');

		// ทำการแก้ไข Conditoin ใน Database
		await ConRankDisModel.findByIdAndUpdate(idConRank, {
			condition: !!condition ? condition : ConRankDisMoID.condition,
			img: !!img ? img : ConRankDisMoID.img
		});

		// ค้นหา ConditoinRankDisModel ที่จะอัพเดต
		const updatedConRankDisModel = await ConRankDisModel.findById(idConRank)

		// return ค่า
		return updatedConRankDisModel;
	},
	deleteConditionRankDisModel: async (parent, args, { userId }, info) => {
		const { idConRank, idRank } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);
		const ConRankDisMoID = await ConRankDisModel.findById(idConRank)

		// // เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		// if (userId !== proTypeId.product.user.toString())
		// 	throw new Error('You not authorized.');

		// ลบ ConRankDisModel
		const deletedConRankDisModel = await ConRankDisModel.findByIdAndRemove(
			idConRank
		)

		// อัพ rankDisModel.condition ใหม่เพราะมี condition ลบไป
		const updatedRankDisModel = RankDisMoID.condition.filter(
			(conditionId) => conditionId.toString() !== deletedConRankDisModel.id.toString()
		);
		await RankDisModel.findByIdAndUpdate(idRank, {
			condition: updatedRankDisModel
		});

		// return ค่า
		return deletedConRankDisModel;
	},
//! Treatment Rank Distributor Model
	addTreatmentRankDisModel: async (parent, args, { userId }, info) => {
		const { idRank, treatment, img } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!idRank || !treatment) throw new Error('Please provide all required fields.');

		// สร้าง ConditionRankDisModel ขึ้นมา
		const TreRankDisMoCreate = await TreRankDisModel.create({ ...args });

		// เช็คว่าถ้า RankDisModel ไม่มีตาราง treatment ให้ทำการสร้างและเพิ่ม
		if (!RankDisMoID.treatment) {
			RankDisMoID.treatment = [TreRankDisMoCreate];
		} else {
			RankDisMoID.treatment.push(TreRankDisMoCreate);
		}

		// save ข้อมูล product
		await RankDisMoID.save();

		// return ค่า
		return TreRankDisModel.findById(TreRankDisMoCreate.id)
	},
	updateTreatmentRankDisModel: async (parent, args, { userId }, info) => {
		const { idRank, idTreRank, treatment, img } = args;

		// เช็คว่ามี user หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);
		const TreRankDisMoID = await TreRankDisModel.findById(idTreRank)

		// เช็คว่ามี ConditoinRankDisModel ที่จะแก้ไขหรือไม่
		if (!TreRankDisMoID) throw new Error('There are not product IDs metioned.');

		// ทำการแก้ไข Conditoin ใน Database
		await TreRankDisModel.findByIdAndUpdate(idTreRank, {
			treatment: !!treatment ? treatment : TreRankDisMoID.treatment,
			img: !!img ? img : TreRankDisMoID.img
		});

		// ค้นหา ConditoinRankDisModel ที่จะอัพเดต
		const updatedTreRankDisModel = await TreRankDisModel.findById(idTreRank)

		// return ค่า
		return updatedTreRankDisModel;
	},
	deleteTreatmentRankDisModel: async (parent, args, { userId }, info) => {
		const { idTreRank, idRank } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา RankDisModel ใน database
		const RankDisMoID = await RankDisModel.findById(idRank);
		const TreRankDisMoID = await TreRankDisModel.findById(idTreRank)

		// // เช็คว่า user เป็นเจ้าของ Stock หรือไม่
		// if (userId !== proTypeId.product.user.toString())
		// 	throw new Error('You not authorized.');

		// ลบ TreRankDisModel
		const deletedTreRankDisModel = await TreRankDisModel.findByIdAndRemove(
			idTreRank
		)

		// อัพ rankDisModel.treatment ใหม่เพราะมี treatment ลบไป
		const updatedRankDisModel = RankDisMoID.treatment.filter(
			(treatmentId) => treatmentId.toString() !== deletedTreRankDisModel.id.toString()
		);
		await RankDisModel.findByIdAndUpdate(idRank, {
			treatment: updatedRankDisModel
		});

		// return ค่า
		return deletedTreRankDisModel;
	}
};

export default Mutation;
