// The structure of the data coming back from the server
export interface CommentListResponseObject {
	host_name: string;
	service_description: string;
	comment_type: number;
  author: string;
  entry_time: number;
  comment_data: string;
  
	// There are a LOT more fields but I'm only typing the ones I need for now
}

export interface CommentListObject {
	hosts: Record<string, { comments: CommentListResponseObject[] }>;
	services: Record<string, { comments: CommentListResponseObject[] }>;
}