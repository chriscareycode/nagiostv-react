import { atom } from 'jotai';
import { CommentListResponseObject } from 'types/commentTypes';

interface CommentListAtom {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, any>;
	commentlistObject: {
		hosts: Record<string, { comments: CommentListResponseObject[] }>;
		services: Record<string, { comments: CommentListResponseObject[] }>;
	};
}

const initialState: CommentListAtom = {
	error: false,
	errorCount: 0,
	errorMessage: '',
	lastUpdate: 0,
	response: {},
	commentlistObject: {
		hosts: {},
		services: {}
	},
};

export const commentlistAtom = atom(initialState);

