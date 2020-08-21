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

const Mutation = {
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
			!args.phone ||
			!args.email ||
			!args.authority
		)
			throw new Error('Please fill out all information.');

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
	addProduct: async (parent, args, { userId }, info) => {
		const {
			name,
			description,
			price,
			min_of_stock,
			discountType,
			disconst,
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

		// เช็คว่ามีการใส่ฟิลที่กำหนดครบหรือไม่
		if (!name || !description || !price || !min_of_stock || !ParentSKU)
			throw new Error('Please provide all required fields.');

		// สร้าง product ขึ้นมา
		const productCreate = await Product.create({ ...args, user: userId });

		// เช็คว่าถ้า user ไม่มีตาราง products ให้ทำการสร้างและเพิ่ม
		if (!user.products) {
			user.products = [productCreate];
		} else {
			user.products.push(productCreate);
		}

		// save ข้อมูล user
		await user.save();

		// return ค่า
		return Product.findById(productCreate.id)
			.populate({
				path: 'user',
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
			});
	},
	updateProduct: async (parent, args, { userId }, info) => {
		const {
			id,
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
			discount: !!discount ? discount : productId.disconst,
			discountTimeStart: !!discountTimeStart
				? discountTimeStart
				: productId.discountTimeStart,
			discountTimeEnd: !!discountTimeEnd
				? discountTimeEnd
				: productId.discountTimeEnd,
			mem_point: !!mem_point ? mem_point : productId.mem_point,
			dis_point: !!dis_point ? dis_point : productId.dis_point,
			SKU: !!SKU ? SKU : productId.SKU,
			ParentSKU: !!ParentSKU ? ParentSKU : productId.ParentSKU
		});

		// ค้นหา product ที่จะอัพเดต
		const updatedProduct = await Product.findById(id)
			.populate({
				path: 'user',
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
			});

		// return ค่า
		return updatedProduct;
	},
	deleteProduct: async (parent, args, { userId }, info) => {
		const { id } = args;

		// เช็คว่ามี userId หรือไม่
		if (!userId) throw new Error('Please log in.');

		// ค้นหา user และ product ใน database
		const user = await User.findById(userId);
		const product = await Product.findById(id);

		// เช็คว่า user เป็นเจ้าของ product หรือไม่
		if (userId !== product.user.toString())
			throw new Error('You not authorized.');

		// ลบ product
		const deletedProduct = await Product.findByIdAndRemove(id)
			.populate({
				path: 'user',
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
			});

		// อัพ user.product ใหม่เพราะมี product ลบไป
		const updatedUserProduct = user.products.filter(
			(productId) => productId.toString() !== deletedProduct.id.toString()
		);
		await User.findByIdAndUpdate(userId, {
			products: updatedUserProduct
		});

		// return ค่า
		return deletedProduct;
	},
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
	}
};

export default Mutation;
