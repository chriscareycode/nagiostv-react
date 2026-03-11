import { createContext, ReactNode, useState } from "react";

interface AppContextType {
	preset: string;
	enterAnimation: string;
	exitAnimation: string;
	setPreset: (preset: string) => void;
	setEnterAnimation: (animation: string) => void;
	setExitAnimation: (animation: string) => void;
}

export const AppContext = createContext<AppContextType>({
	preset: "",
	enterAnimation: "",
	exitAnimation: "",
	setPreset: () => {},
	setEnterAnimation: () => {},
	setExitAnimation: () => {}
});

interface AppContextProviderProps {
	children: ReactNode;
}

export function AppContextProvider({ children }: AppContextProviderProps) {
	const [preset, setPreset] = useState("moveToLeftFromRight");
	const [enterAnimation, setEnterAnimation] = useState("");
	const [exitAnimation, setExitAnimation] = useState("");

	return (
		<AppContext.Provider
			value={{
				preset,
				enterAnimation,
				exitAnimation,
				setPreset,
				setEnterAnimation,
				setExitAnimation
			}}
		>
			{children}
		</AppContext.Provider>
	);
}
