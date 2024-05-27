import { ServiceList } from "types/hostAndServiceTypes";

export function howManyServiceCounter(servicelist: ServiceList, totalCount: React.MutableRefObject<number>) {
	// count how many items in each of the service states
	let howManyServices = 0;
	let howManyServicePending = 0;
	let howManyServiceWarning = 0;
	let howManyServiceUnknown = 0;
	let howManyServiceCritical = 0;
	let howManyServiceAcked = 0;
	let howManyServiceScheduled = 0;
	let howManyServiceFlapping = 0;
	let howManyServiceSoft = 0;
	let howManyServiceNotificationsDisabled = 0;

	if (servicelist) {
		Object.keys(servicelist).forEach((host) => {
			
			// Deprecated now that we are getting the count from another api
			howManyServices += Object.keys(servicelist[host]).length;

			Object.keys(servicelist[host]).forEach((service) => {
				if (servicelist[host][service].status === 1) {
					howManyServicePending++;
				}
				if (servicelist[host][service].status === 4) {
					howManyServiceWarning++;
				}
				if (servicelist[host][service].status === 8) {
					howManyServiceUnknown++;
				}
				if (servicelist[host][service].status === 16) {
					howManyServiceCritical++;
				}
				if (servicelist[host][service].problem_has_been_acknowledged) {
					howManyServiceAcked++;
				}
				if (servicelist[host][service].scheduled_downtime_depth > 0) {
					howManyServiceScheduled++;
				}
				if (servicelist[host][service].is_flapping) {
					howManyServiceFlapping++;
				}
				// only count soft items if they are not OK state
				if (servicelist[host][service].status !== 2 && servicelist[host][service].state_type === 0) {
					howManyServiceSoft++;
				}
				// count notifications_enabled === false
				// only count notifications_enabled items if they are not OK state
				if (servicelist[host][service].status !== 2 && servicelist[host][service].notifications_enabled === false) {
					howManyServiceNotificationsDisabled++;
				}
			});
		});
	}
	
	howManyServices = totalCount.current;

	const howManyServiceOk = howManyServices - howManyServiceWarning - howManyServiceCritical - howManyServiceUnknown;

	return {
		howManyServices,
		howManyServiceOk,
		howManyServicePending,
		howManyServiceWarning,
		howManyServiceUnknown,
		howManyServiceCritical,
		howManyServiceAcked,
		howManyServiceScheduled,
		howManyServiceFlapping,
		howManyServiceSoft,
		howManyServiceNotificationsDisabled,
	};

}