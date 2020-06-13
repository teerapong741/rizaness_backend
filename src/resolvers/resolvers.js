import { GraphQLDateTime, GraphQLDate } from 'graphql-iso-date';

import Query from './query';
import Mutation from './mutation';

export const resolvers = {
	Query,
	Mutation,
	DateTime: GraphQLDateTime,
	Date: GraphQLDate
};

export default resolvers;
