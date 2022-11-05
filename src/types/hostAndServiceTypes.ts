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
	last_time_ok: number;
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
	
}
export interface AlertWrap {
	error: boolean;
	errorCount: number;
	errorMessage: string;
	lastUpdate: number;
	response: Record<string, any>;
	responseArray: Alert[]
}