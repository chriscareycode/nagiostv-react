import { useEffect, useState } from 'react';
// Recoil
import { useRecoilValue } from 'recoil';
import { hostHowManyAtom } from '../../atoms/hostAtom';
import { serviceHowManyAtom } from '../../atoms/serviceAtom';
import { alertAtom } from '../../atoms/alertAtom';
// Helpers
import { formatDateTimeAgoColorQuietFor } from '../../helpers/moment';
// CSS
import './Summary.css';


export default function Summary() {

  // Recoil state (this section)
  const hostHowManyState = useRecoilValue(hostHowManyAtom);
  const serviceHowManyState = useRecoilValue(serviceHowManyAtom);
  const alertState = useRecoilValue(alertAtom);

  let quietForMs: number | null = null;
  if (alertState && alertState.responseArray && alertState.responseArray.length > 0) {
    quietForMs = alertState.responseArray[0].timestamp;
  }

  const scrollDown = () => {
    const scrollAreaSelector = '.vertical-scroll-dash';
    const scrollDiv = document.querySelector(scrollAreaSelector);
    const alertDiv = document.querySelector<HTMLDivElement>('.AlertSection');
    if (scrollDiv && alertDiv) {
      scrollDiv.scrollTo({ top: alertDiv.offsetTop - 15, behavior: 'smooth' });
    }
  };

  // Trigger a re-render every minute to get the Quiet For value to show the correct minute
  const [, setTriggerRender] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      setTriggerRender(new Date().getTime());
    }, 60 * 1000);
    return () => {
      clearInterval(i);
    };
  });

  return (
    <div className="summary">

      {/* <div className="service-summary">
        <span className="service-summary-title">
          Summary
        </span>
      </div> */}
      
      <div className="summary-item">

        <div className="summary-box">
          <div className="summary-box-big-number">
            {/* <span className="color-green">{hostHowManyState.howManyHostUp}</span>
            <span className="color-darkblue"> / </span> */}
            <span className={hostHowManyState.howManyHostDown > 0 ? 'color-red' : 'color-green'}>{hostHowManyState.howManyHostDown}</span>
          </div>
          <div className="summary-box-text"><span className={hostHowManyState.howManyHostDown > 0 ? 'color-white' : 'color-white'}>hosts<br />down</span></div>
        </div>

        <div className="summary-box">
          <div className="summary-box-big-number">
            <span className={hostHowManyState.howManyHostUnreachable > 0 ? 'color-red' : 'color-green'}>{hostHowManyState.howManyHostUnreachable}</span>
          </div>
          <div className="summary-box-text"><span className={hostHowManyState.howManyHostUnreachable > 0 ? 'color-white' : 'color-white'}>hosts<br />unreachable</span></div>
        </div>

        <div className="summary-box summary-box-separator">
          
        </div>

        <div className="summary-box">
          <div className="summary-box-big-number">
            {/* <span className="color-green">{serviceHowManyState.howManyServiceOk}</span>
            <span className="color-darkblue"> / </span> */}
            <span className={serviceHowManyState.howManyServiceCritical > 0 ? 'color-red' : 'color-green'}>{serviceHowManyState.howManyServiceCritical}</span>
            {/* <span className="color-darkblue"> / </span>
            <span className={serviceHowManyState.howManyServiceWarning > 0 ? 'color-yellow' : 'color-green'}>{serviceHowManyState.howManyServiceWarning}</span> */}
          </div>
          <div className="summary-box-text"><span className={serviceHowManyState.howManyServiceCritical > 0 ? 'color-white' : 'color-white'}>services<br />critical</span></div>
        </div>

        <div className="summary-box">
          <div className="summary-box-big-number">
            {/* <span className="color-green">{serviceHowManyState.howManyServiceOk}</span>
            <span className="color-darkblue"> / </span> */}
            {/* <span className={serviceHowManyState.howManyServiceCritical > 0 ? 'color-red' : 'color-green'}>{serviceHowManyState.howManyServiceCritical}</span>
            <span className="color-darkblue"> / </span> */}
            <span className={serviceHowManyState.howManyServiceWarning > 0 ? 'color-yellow' : 'color-green'}>{serviceHowManyState.howManyServiceWarning}</span>
          </div>
          <div className="summary-box-text"><span className={serviceHowManyState.howManyServiceWarning > 0 ? 'color-white' : 'color-white'}>services<br />warning</span></div>
        </div>

        <div className="summary-box">
          <div className="summary-box-big-number">
            <span className={serviceHowManyState.howManyServiceUnknown > 0 ? 'color-orange' : 'color-green'}>{serviceHowManyState.howManyServiceUnknown}</span>
          </div>
          <div className="summary-box-text"><span className={serviceHowManyState.howManyServiceUnknown > 0 ? 'color-white' : 'color-white'}>services<br />unknown</span></div>
        </div>

        <div className="summary-box float-right overflow-hidden" onClick={scrollDown} style={{ cursor: 'pointer' }}>
          <div className="margin-top-5 font-size-0-6 no-wrap">Quiet For</div>
          <div className="margin-top-5 color-peach no-wrap">{quietForMs ? formatDateTimeAgoColorQuietFor(quietForMs) : '?'}</div>
        </div>

        {/* <div className="summary-box float-right">
          <div className="margin-top-5 font-size-0-6">Uptime</div>
          <div className="margin-top-5 color-peach">1d 1h 1m</div>
        </div>

        <div className="summary-box">
         <div className="margin-top-5 font-size-0-6">Nagios</div>
         <div className="margin-top-5 color-peach">v4.4.6</div>
        </div> */}

        {/* <div className="summary-box float-right">
          Drift<br />
          20s
        </div> */}

        <br />

        {/* <span className="margin-left-10  color-white" style={{ margin: '5px 10px' }}>
          Hosts: 29 Services: 99, Nagios v4.4.6 Uptime: 1d 1h 1m Drift: 200s
          <div className="font-size-small">
            Most recent alert 10h 5m ago:
          <div className="AlertItem border-green"><div className="AlertItemRight"><span className="uppercase alert-item-state-type-1">hard</span> <span className="uppercase color-green">service ok </span><div className="alert-item-right-date align-right">Sat, Oct 9, 2021 8:30 AM</div></div><span ><div ><span className="alert-item-host-name">unicorn</span> <span className="color-green"><span className="alert-item-description">Check APT</span>APT OK: 0 packages available for upgrade (0 critical updates).</span></div></span></div>
          </div>
        </span> */}
        
      </div>
    </div>
  );
}