import { HostList } from "types/hostAndServiceTypes";

export function howManyHostCounter(hostlist: HostList, totalCount: React.MutableRefObject<number>) {

	const howManyHosts = totalCount.current;

	let howManyHostPending = 0;
	let howManyHostUp = 0;
	let howManyHostDown = 0;
	let howManyHostUnreachable = 0;
	let howManyHostAcked = 0;
	let howManyHostScheduled = 0;
	let howManyHostFlapping = 0;
	let howManyHostSoft = 0;
	let howManyHostNotificationsDisabled = 0;

	if (hostlist) {
		Object.keys(hostlist).forEach((host) => {

			if (hostlist[host].status === 1) {
				howManyHostPending++;
			}
			if (hostlist[host].status === 4) {
				howManyHostDown++;
			}
			if (hostlist[host].status === 8) {
				howManyHostUnreachable++;
			}
			if (hostlist[host].problem_has_been_acknowledged) {
				howManyHostAcked++;
			}
			if (hostlist[host].scheduled_downtime_depth > 0) {
				howManyHostScheduled++;
			}
			if (hostlist[host].is_flapping) {
				howManyHostFlapping++;
			}
			// only count soft items if they are not up
			if (hostlist[host].status !== 2 && hostlist[host].state_type === 0) {
				howManyHostSoft++;
			}
			// count notifications_enabled === false
			// only count these if they are not up
			if (hostlist[host].status !== 2 && hostlist[host].notifications_enabled === false) {
				howManyHostNotificationsDisabled++;
			}
		});

		howManyHostUp = howManyHosts - howManyHostDown - howManyHostUnreachable;
	}

	return {
		howManyHosts,
		howManyHostPending,
		howManyHostUp,
		howManyHostDown,
		howManyHostUnreachable,
		howManyHostAcked,
		howManyHostScheduled,
		howManyHostFlapping,
		howManyHostSoft,
		howManyHostNotificationsDisabled,
	};
}