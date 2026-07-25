import { ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import { translate } from '../../helpers/language';
import useVisibilityChange from '../../hooks/useVisibilityChange';

interface MonitoringItemsProps<T> {
	allHealthyMessage: string;
	className: string;
	filteredItems: T[];
	getKey: (item: T) => string;
	itemClassName: string;
	items: T[];
	itemsWrapClassName: string;
	language: string;
	renderItem: (item: T, problemCount: number) => ReactNode;
	totalCount: number;
	type: 'host' | 'service';
}

const MonitoringItems = <T,>({
	allHealthyMessage,
	className,
	filteredItems,
	getKey,
	itemClassName,
	items,
	itemsWrapClassName,
	language,
	renderItem,
	totalCount,
	type,
}: MonitoringItemsProps<T>) => {
	const visibilityKey = useVisibilityChange();
	const hiddenCount = items.length - filteredItems.length;
	const allProblemsHidden = items.length > 0 && filteredItems.length === 0;

	return (
		<div className={className}>
			<AnimatePresence initial={false} key={`${type}-all-ok-${visibilityKey}`}>
				{items.length === 0 && (
					<motion.div
						className="all-ok-item"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
					>
						<span
							style={{ margin: '5px 10px' }}
							className="margin-left-10 display-inline-block color-green"
						>
							{translate('All', language)} {totalCount}{' '}
							{translate(allHealthyMessage, language)}
						</span>{' '}
					</motion.div>
				)}
			</AnimatePresence>

			<div className={`some-down-items ${allProblemsHidden ? 'visible' : 'hidden'}`}>
				<div>
					<span
						className="display-inline-block color-green"
						style={{ marginRight: '10px' }}
					>
						{totalCount - items.length} of {totalCount}{' '}
						{translate(allHealthyMessage, language)}
					</span>{' '}
					<span className="filter-ok-label filter-ok-label-green some-down-hidden-text">
						{hiddenCount} hidden
					</span>
				</div>
			</div>

			<div className={itemsWrapClassName}>
				<AnimatePresence initial={false} key={`${type}-items-${visibilityKey}`}>
					{filteredItems.map(item => (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3, ease: 'easeInOut' }}
							key={getKey(item)}
							className={itemClassName}
							style={{ overflow: 'hidden' }}
						>
							{renderItem(item, filteredItems.length)}
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default MonitoringItems;
