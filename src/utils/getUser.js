import jwt from 'jsonwebtoken';

const getUser = (token) => {
	if (!token) return null;

	// token จะมีรูปแบบคือ 'Bearer mzcxvlnldfna...' หลังจากเรา split จะได้ -> [Bearer , mzcxvlnldfna...]
	const parsedToken = token.split(' ')[1];
	try {
		const decodedToken = jwt.verify(parsedToken, process.env.SECRET);
		return decodedToken.userId;
	} catch (error) {
		return null;
	}
};

export default getUser;
