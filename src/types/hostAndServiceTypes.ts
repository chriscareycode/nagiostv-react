export interface Host {
	
}
export interface HostWrap {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, any>;
	problemsArray: Host[]
}

export interface Service {
	// TODO: sort these
	host_name: string;
	description: string;
	last_time_ok: number;
	problem_has_been_acknowledged: boolean;
	scheduled_downtime_depth: number;
	status: number;
	is_flapping: boolean;
	state_type: number;
	notifications_enabled: boolean;
	next_check: number;
	last_check: number;
	check_type: number;
	current_attempt: number;
	max_attempts: number;
	plugin_output: string;
	checks_enabled: boolean;
}
export interface ServiceWrap {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, any>;
	problemsArray: Service[]
}

export interface Alert {
	timestamp: number;
	state: number;
	description: string;
	plugin_output: string;
}
export interface AlertWrap {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, any>;
	responseArray: Alert[]
}

export interface Comment {
	author: string;
	entry_time: number;
	comment_data: string;
}