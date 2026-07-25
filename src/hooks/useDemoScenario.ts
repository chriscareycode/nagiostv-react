import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { hostAtom, hostIsFakeDataSetAtom } from '../atoms/hostAtom';
import { serviceAtom, serviceIsFakeDataSetAtom } from '../atoms/serviceAtom';
import {
	changeHostStatus,
	changeServiceStatus,
} from '../components/demo/demoState';
import {
	convertHostObjectToArray,
	convertServiceObjectToArray,
} from '../helpers/nagiostv';
import { HostList, ServiceList } from '../types/hostAndServiceTypes';

export function useDemoScenario() {
	const [isVisible, setIsVisible] = useState(false);
	const store = useStore();
	const setHostState = useSetAtom(hostAtom);
	const setServiceState = useSetAtom(serviceAtom);
	const isHostFakeDataSet = useAtomValue(hostIsFakeDataSetAtom);
	const isServiceFakeDataSet = useAtomValue(serviceIsFakeDataSetAtom);
	const hostlistRef = useRef<HostList>({});
	const servicelistRef = useRef<ServiceList>({});

	const applyHostTransition = useCallback((
		transition: (hostlist: HostList) => HostList,
	) => {
		const nextHostlist = transition(hostlistRef.current);
		if (nextHostlist === hostlistRef.current) {
			return;
		}
		hostlistRef.current = nextHostlist;
		setHostState(current => ({
			...current,
			response: nextHostlist,
			stateArray: convertHostObjectToArray(nextHostlist),
		}));
	}, [setHostState]);

	const applyServiceTransition = useCallback((
		transition: (servicelist: ServiceList) => ServiceList,
	) => {
		const nextServicelist = transition(servicelistRef.current);
		if (nextServicelist === servicelistRef.current) {
			return;
		}
		servicelistRef.current = nextServicelist;
		setServiceState(current => ({
			...current,
			response: nextServicelist,
			stateArray: convertServiceObjectToArray(nextServicelist),
		}));
	}, [setServiceState]);

	const addHostDown = useCallback(() => {
		applyHostTransition(hostlist => changeHostStatus(hostlist, 2, 4, 'first'));
	}, [applyHostTransition]);

	const removeHostDown = useCallback(() => {
		applyHostTransition(hostlist => changeHostStatus(hostlist, 4, 2, 'last'));
	}, [applyHostTransition]);

	const addServiceWarning = useCallback(() => {
		applyServiceTransition(servicelist => changeServiceStatus(servicelist, 2, 4, 'first'));
	}, [applyServiceTransition]);

	const addServiceCritical = useCallback(() => {
		applyServiceTransition(servicelist => changeServiceStatus(servicelist, 2, 16, 'first'));
	}, [applyServiceTransition]);

	const removeServiceWarning = useCallback(() => {
		applyServiceTransition(servicelist => changeServiceStatus(servicelist, 4, 2, 'last'));
	}, [applyServiceTransition]);

	const removeServiceCritical = useCallback(() => {
		applyServiceTransition(servicelist => changeServiceStatus(servicelist, 16, 2, 'last'));
	}, [applyServiceTransition]);

	useEffect(() => {
		if (!isHostFakeDataSet) {
			setIsVisible(false);
			return;
		}

		hostlistRef.current = store.get(hostAtom).response as HostList;
		addHostDown();
		addHostDown();
		addHostDown();

		const timers = [
			setTimeout(removeHostDown, 10_000),
			setTimeout(removeHostDown, 25_000),
			setTimeout(() => {
				removeHostDown();
				setIsVisible(true);
			}, 35_000),
			setTimeout(removeHostDown, 40_000),
		];

		return () => timers.forEach(clearTimeout);
	}, [addHostDown, isHostFakeDataSet, removeHostDown, store]);

	useEffect(() => {
		if (!isServiceFakeDataSet) {
			return;
		}

		servicelistRef.current = store.get(serviceAtom).response as ServiceList;
		addServiceWarning();
		addServiceWarning();
		addServiceCritical();
		addServiceCritical();

		const timers = [
			setTimeout(removeServiceWarning, 6_000),
			setTimeout(addServiceWarning, 12_000),
			setTimeout(removeServiceCritical, 15_000),
			setTimeout(removeServiceWarning, 20_000),
			setTimeout(removeServiceCritical, 30_000),
			setTimeout(() => {
				removeServiceWarning();
				removeServiceWarning();
			}, 35_000),
		];

		return () => timers.forEach(clearTimeout);
	}, [
		addServiceCritical,
		addServiceWarning,
		isServiceFakeDataSet,
		removeServiceCritical,
		removeServiceWarning,
		store,
	]);

	return {
		addServiceCritical,
		addServiceWarning,
		isVisible,
		removeServiceCritical,
		removeServiceWarning,
	};
}
