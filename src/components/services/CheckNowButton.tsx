
import $ from 'jquery';
import React, { useEffect, useState } from 'react';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

interface CheckNowButtonProps {
	host: string;
	service: string;
	forceCheckNow: Function;
	nextCheck: number;
}

const CheckNowButton = ({ host, service, forceCheckNow, nextCheck }: CheckNowButtonProps) => {

	const [isChecking, setIsChecking] = useState(false);

	useEffect(() => {
		setIsChecking(false);
	}, [nextCheck]);

	const onClick = (e: React.MouseEvent) => {

		e.preventDefault();
		e.stopPropagation();

		setIsChecking(true);

		//const url = `connectors/cmdfile.php`;
		const url = `http://10.69.0.42/nagiostv/connectors/cmdfile.php`;
		$.ajax({
			method: "POST",
			data: {
				host,
				service,
			},
			url,
			dataType: "html",
			timeout: 5 * 1000
		}).done((res, textStatus, jqXHR) => {
			//
			console.log('POST success', res, textStatus, jqXHR);
			//setIsChecking(false);
			forceCheckNow();
		}).fail((jqXHR, textStatus, errorThrown) => {
			//
			console.log('POST fail', jqXHR, textStatus, errorThrown);
			//setIsChecking(false);
		});
	};

	const styl = {
		marginLeft: '5px',
		backgroundColor: '#333',
		color: 'white',
		border: '1px solid #555',
		borderRadius: '3px',
		padding: '2px 4px',
		fontSize: '0.8em',
	};

	return (
		<button style={styl} disabled={isChecking} onClick={onClick}>
			Check Now
			{isChecking && <span> <FontAwesomeIcon icon={faCircleNotch} spin /></span>}
		</button>
	);
}

export default CheckNowButton;
